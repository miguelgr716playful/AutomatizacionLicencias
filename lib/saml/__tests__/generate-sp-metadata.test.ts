import { describe, it, expect } from "vitest";
import { generateServiceProviderMetadata } from "../generate-sp-metadata";
import { getSamlSpConfig } from "../sp-config";

describe("generateServiceProviderMetadata", () => {
  it("genera EntityDescriptor con ACS y Entity ID", () => {
    const xml = generateServiceProviderMetadata({
      entityId: "https://app.ejemplo.com",
      assertionConsumerServiceUrl: "https://bff.ejemplo.com/acs",
      wantAssertionsSigned: true,
      authnRequestsSigned: false,
      nameIdFormat:
        "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    });

    expect(xml).toContain('entityID="https://app.ejemplo.com"');
    expect(xml).toContain(
      'Location="https://bff.ejemplo.com/acs"'
    );
    expect(xml).toContain("SPSSODescriptor");
    expect(xml).not.toContain("X509Certificate");
  });

  it("incluye certificado cuando se proporciona", () => {
    const xml = generateServiceProviderMetadata({
      entityId: "https://app.ejemplo.com",
      assertionConsumerServiceUrl: "https://bff.ejemplo.com/acs",
      publicCert: "ABC123CERT",
      wantAssertionsSigned: true,
      authnRequestsSigned: true,
      nameIdFormat:
        "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    });

    expect(xml).toContain("<ds:X509Certificate>ABC123CERT</ds:X509Certificate>");
    expect(xml).toContain('AuthnRequestsSigned="true"');
  });
});

describe("getSamlSpConfig", () => {
  it("exige entity id y ACS", () => {
    expect(() => getSamlSpConfig({})).toThrow("SAML_SP_ENTITY_ID");
  });

  it("lee env y limpia PEM", () => {
    const config = getSamlSpConfig({
      SAML_SP_ENTITY_ID: "https://app.ejemplo.com",
      SAML_SP_ACS_URL: "https://bff.ejemplo.com/acs",
      SAML_SP_PUBLIC_CERT:
        "-----BEGIN CERTIFICATE-----\nABC\n123\n-----END CERTIFICATE-----",
    });

    expect(config.publicCert).toBe("ABC123");
    expect(config.wantAssertionsSigned).toBe(true);
  });
});
