#!/usr/bin/env python3
"""
Generate Swagger UI HTML documentation identical to FastAPI /docs

Usage:
    python generate_swagger_docs.py [--url BASE_URL] [--output FILE]

Examples:
    python generate_swagger_docs.py
    python generate_swagger_docs.py --url http://localhost:8000 --output swagger_docs.html
"""

import argparse
import json
import sys
import html
import copy

try:
    import requests
except ImportError:
    print("Error: 'requests' library is required. Install it with: pip install requests")
    sys.exit(1)


def fetch_openapi_schema(base_url: str) -> dict:
    """Fetch OpenAPI schema from the API."""
    try:
        response = requests.get(f"{base_url}/openapi.json")
        if response.status_code == 200:
            return response.json()
        else:
            print(f"[ERROR] Failed to fetch OpenAPI schema: {response.status_code}")
            return None
    except Exception as e:
        print(f"[ERROR] Failed to connect to {base_url}: {e}")
        return None


def resolve_refs(obj, components):
    """Recursively resolve all $ref references in the schema."""
    if isinstance(obj, dict):
        if '$ref' in obj and len(obj) == 1:
            ref_path = obj['$ref']
            if ref_path.startswith('#/components/schemas/'):
                schema_name = ref_path.split('/')[-1]
                if schema_name in components.get('schemas', {}):
                    # Return a copy of the resolved schema
                    resolved = copy.deepcopy(components['schemas'][schema_name])
                    return resolve_refs(resolved, components)
            return obj
        else:
            return {k: resolve_refs(v, components) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [resolve_refs(item, components) for item in obj]
    else:
        return obj


def resolve_all_refs(openapi_schema: dict) -> dict:
    """Resolve all $ref in paths while keeping components intact."""
    schema = copy.deepcopy(openapi_schema)
    components = schema.get('components', {})

    # Resolve refs in paths
    if 'paths' in schema:
        schema['paths'] = resolve_refs(schema['paths'], components)

    return schema


def generate_swagger_html(openapi_schema: dict, output_file: str):
    """Generate Swagger UI HTML with embedded OpenAPI schema."""

    title = openapi_schema.get('info', {}).get('title', 'API Documentation')
    description = openapi_schema.get('info', {}).get('description', '')
    version = openapi_schema.get('info', {}).get('version', '1.0.0')

    # Resolve all $ref references
    resolved_schema = resolve_all_refs(openapi_schema)

    # Serialize JSON for embedding
    schema_json = json.dumps(resolved_schema, ensure_ascii=True)

    html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{html.escape(title)} - Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
    <style>
        html {{
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }}
        *, *:before, *:after {{
            box-sizing: inherit;
        }}
        body {{
            margin: 0;
            background: #fafafa;
        }}
        .swagger-ui .topbar {{
            display: none;
        }}
        .info-header {{
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            padding: 20px 40px;
        }}
        .info-header h1 {{
            margin: 0 0 5px 0;
            font-size: 1.8rem;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }}
        .info-header p {{
            margin: 0;
            opacity: 0.9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }}
        .info-header .version {{
            display: inline-block;
            background: #4CAF50;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 0.8rem;
            margin-top: 10px;
        }}
        .credentials-box {{
            background: #e7f3ff;
            border-left: 4px solid #0d6efd;
            padding: 15px 40px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }}
        .credentials-box strong {{
            color: #0d6efd;
        }}
        .credentials-box code {{
            background: #f1f1f1;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        }}
    </style>
</head>
<body>
    <div class="info-header">
        <h1>{html.escape(title)}</h1>
        <p>{html.escape(description)}</p>
        <span class="version">v{html.escape(version)}</span>
    </div>
    <div class="credentials-box">
        <strong>Dane logowania:</strong>
        Login: <code>admin</code> |
        Haslo: <code>1234567890</code>
    </div>
    <div id="swagger-ui"></div>

    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {{
            const spec = {schema_json};

            window.ui = SwaggerUIBundle({{
                spec: spec,
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 2,
                docExpansion: "list",
                filter: true,
                showExtensions: true,
                showCommonExtensions: true
            }});
        }};
    </script>
</body>
</html>
'''

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"[OK] Swagger UI documentation generated: {output_file}")


def main():
    parser = argparse.ArgumentParser(description='Generate Swagger UI HTML documentation')
    parser.add_argument('--url', default='http://localhost:8000', help='API base URL')
    parser.add_argument('--output', default='SwaggerAPI.html', help='Output HTML file')

    args = parser.parse_args()

    print(f"Swagger UI Documentation Generator")
    print(f"=" * 40)
    print(f"API URL: {args.url}")
    print(f"Output:  {args.output}")
    print()

    print("[*] Fetching OpenAPI schema...")
    schema = fetch_openapi_schema(args.url)

    if schema:
        print(f"[OK] Schema loaded: {schema.get('info', {}).get('title', 'Unknown')}")
        generate_swagger_html(schema, args.output)
    else:
        print("[ERROR] Failed to generate documentation")
        sys.exit(1)


if __name__ == '__main__':
    main()
