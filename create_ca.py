from OpenSSL import crypto

# Generate Root CA key
ca_key = crypto.PKey()
ca_key.generate_key(crypto.TYPE_RSA, 4096)

# Create Root CA certificate
ca_cert = crypto.X509()
ca_cert.set_serial_number(1000)
ca_cert.gmtime_adj_notBefore(0)
ca_cert.gmtime_adj_notAfter(3650 * 24 * 60 * 60)  # 10 years validity
ca_cert.get_subject().CN = "My Private CA"  # Common Name
ca_cert.set_issuer(ca_cert.get_subject())  # Self-signed
ca_cert.set_pubkey(ca_key)
ca_cert.set_version(2)

# Add CA extension
ca_cert.add_extensions([
    crypto.X509Extension(b"basicConstraints", True, b"CA:TRUE, pathlen:0"),
    crypto.X509Extension(b"keyUsage", True, b"keyCertSign, cRLSign"),
    crypto.X509Extension(b"subjectKeyIdentifier", False, b"hash", subject=ca_cert),
])

# Sign the CA certificate
ca_cert.sign(ca_key, "sha256")

# Save the CA private key and certificate
with open("rootCA.key", "wt") as f:
    f.write(crypto.dump_privatekey(crypto.FILETYPE_PEM, ca_key).decode("utf-8"))

with open("rootCA.crt", "wt") as f:
    f.write(crypto.dump_certificate(crypto.FILETYPE_PEM, ca_cert).decode("utf-8"))

print("✅ Root CA created successfully: rootCA.key, rootCA.crt")
