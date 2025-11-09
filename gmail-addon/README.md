# Gmail Add-on for EventFlow

## Setup Instructions

1. Go to [script.google.com](https://script.google.com) and create a new project
2. Copy all `.gs` files into the project
3. Copy `appsscript.json` content into the project manifest (Project Settings > Show manifest file)
4. Set `API_KEY` in Project Settings > Script Properties:
   - Property: `API_KEY`
   - Value: Your backend API key
5. Update `API_BASE` in `Code.gs` to your production domain
6. Deploy as Gmail Add-on:
   - Publish > Deploy from manifest
   - Test deployment first, then publish

## Testing

1. Use Test Deployment to test in Gmail
2. Open any email with event-like content
3. The add-on card should appear in the sidebar
4. Click "Approve & Add to Calendar" to test the flow

## Notes

- Replace `https://your-domain.com` with your actual domain
- Update logo and icon URLs
- Configure OAuth scopes as needed
- The add-on will appear in Gmail sidebar when viewing emails

