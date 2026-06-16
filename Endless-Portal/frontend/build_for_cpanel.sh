#!/bin/bash
echo "Enter your production backend URL (e.g., https://api.endlesse.com):"
read API_URL
echo "NEXT_PUBLIC_API_URL=$API_URL" > .env.production
npm run build
rm -f frontend_cpanel.zip
zip -r frontend_cpanel.zip out
echo "Done! Upload frontend_cpanel.zip to your public_html folder in cPanel."
