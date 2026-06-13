export function buildDnsInstructions(domain, token) {
  const serverIp =
    String(process.env.PLATFORM_SERVER_IP || process.env.SERVER_IP || '').trim() ||
    'YOUR_SERVER_IP';

  return {
    serverIp,
    apexARecord: {
      host: '@',
      type: 'A',
      value: serverIp,
      label: 'Root domain (apex)',
    },
    wwwCnameRecord: {
      host: 'www',
      type: 'CNAME',
      value: domain,
      label: 'WWW subdomain',
    },
    txtRecord: {
      host: `_builder-verify.${domain}`,
      type: 'TXT',
      value: `builder-verify=${token}`,
      label: 'Ownership verification',
    },
    note:
      'Point your apex (@) A record to the platform server IP, set www as a CNAME to your root domain, then add the TXT record and click Verify.',
  };
}
