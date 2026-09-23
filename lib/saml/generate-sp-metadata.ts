import type { SamlSpConfig } from "./sp-config";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Genera XML de metadata SAML 2.0 del Service Provider.
 * Compatible con lo que suelen pedir IdP / NAM / equipos de identidad.
 */
export function generateServiceProviderMetadata(config: SamlSpConfig): string {
  const keyDescriptors = config.publicCert
    ? `
    <KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${config.publicCert}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </KeyDescriptor>
    <KeyDescriptor use="encryption">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${config.publicCert}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </KeyDescriptor>`
    : "";

  const slo = config.singleLogoutServiceUrl
    ? `
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${escapeXml(config.singleLogoutServiceUrl)}"/>
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${escapeXml(config.singleLogoutServiceUrl)}"/>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${escapeXml(config.entityId)}">
  <SPSSODescriptor AuthnRequestsSigned="${config.authnRequestsSigned}" WantAssertionsSigned="${config.wantAssertionsSigned}" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">${keyDescriptors}${slo}
    <NameIDFormat>${escapeXml(config.nameIdFormat)}</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${escapeXml(config.assertionConsumerServiceUrl)}" index="0" isDefault="true"/>
  </SPSSODescriptor>
</EntityDescriptor>
`;
}
