export default function JsonLd({ data }) {
  if (!data || typeof data !== 'object') return null;
  let json = '';
  try {
    json = JSON.stringify(data);
  } catch {
    return null;
  }
  if (!json) return null;
  // Avoid `</script>` injection + keep output HTML-safe.
  const safe = json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safe }} />;
}

