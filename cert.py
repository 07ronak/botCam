from OpenSSL import crypto

# Load Root CA key and certificate
with open("rootCA.key", "rt") as f:
    ca_key = crypto.load_privatekey(crypto.FILETYPE_PEM, f.read())

with open("rootCA.crt", "rt") as f:
    ca_cert = crypto.load_certificate(crypto.FILETYPE_PEM, f.read())

# Generate Server key
server_key = crypto.PKey()
server_key.generate_key(crypto.TYPE_RSA, 2048)

# Create Server Certificate Signing Request (CSR)
server_csr = crypto.X509Req()
server_csr.get_subject().CN = "xxx.xx.xx.x"  # Change to your server's IP
server_csr.set_pubkey(server_key)
server_csr.sign(server_key, "sha256")

# Create Server Certificate
server_cert = crypto.X509()
server_cert.set_serial_number(1001)
server_cert.gmtime_adj_notBefore(0)
server_cert.gmtime_adj_notAfter(365 * 24 * 60 * 60)  # Valid for 1 year
server_cert.set_subject(server_csr.get_subject())
server_cert.set_issuer(ca_cert.get_subject())  # Issued by Root CA
server_cert.set_pubkey(server_key)
server_cert.set_version(2)

# Add SAN (Subject Alternative Names)
server_cert.add_extensions([
    crypto.X509Extension(b"subjectAltName", False, b"DNS:localhost,IP:xxx.xx.xx.x"),
])

# Sign Server Certificate with CA
server_cert.sign(ca_key, "sha256")

# Save Server key and certificate
with open("server.key", "wt") as f:
    f.write(crypto.dump_privatekey(crypto.FILETYPE_PEM, server_key).decode("utf-8"))

with open("server.crt", "wt") as f:
    f.write(crypto.dump_certificate(crypto.FILETYPE_PEM, server_cert).decode("utf-8"))

print("✅ Server certificate created successfully: server.key, server.crt")

""" # Add SAN (Subject Alternative Names)
server_cert.add_extensions([
    crypto.X509Extension(b"subjectAltName", False, b"DNS:localhost,IP:172.20.10.3"),
]) """