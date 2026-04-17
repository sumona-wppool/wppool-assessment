# WPPOOL Shopify Assessment

## Store URL
https://sumona-wppool.myshopify.com

## Tasks Completed
- ✅ Task 1: Multi-Step Product Configurator
- ✅ Task 2: Customer Group Collection Page
- ✅ Task 3: Announcement Bar
- ✅ Task 4: Tawk.to Live Chat
- ✅ Task 5: Purchase Flow Verified

## Setup Instructions
1. Clone this repository
2. Install Shopify CLI: npm install -g @shopify/cli
3. Run: shopify theme dev --store sumona-wppool.myshopify.com

## Task 2 - Customer Group Collection Implementation

### Approach:
- Customer tags used to identify wholesale customers
- Products tagged 'wholesale-only' are only visible to customers tagged 'wholesale'
- Regular customers and logged-out visitors cannot see wholesale products at all
- Implementation uses Liquid templating on the collection page

### Trade-offs:
- Pro: Simple implementation, no app required
- Pro: Works without JavaScript
- Con: Shopify caches pages, so logged-in state may not always reflect immediately
- Con: Does not work with Shopify's default collection filtering
- Con: Search results may still show wholesale products

## Incomplete Tasks
None - All tasks completed.