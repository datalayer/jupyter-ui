const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testStorybookDocs() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let hasErrors = false;
  const results = [];
  
  // Get all MDX files
  const storiesDir = path.join(__dirname, 'src', 'stories');
  const mdxFiles = fs.readdirSync(storiesDir)
    .filter(file => file.endsWith('.mdx'))
    .map(file => file.replace('.mdx', '').toLowerCase());
  
  console.log(`Found ${mdxFiles.length} MDX documentation pages to test\n`);
  
  // Suppress console warnings but capture real errors
  page.on('console', msg => {
    if (msg.type() === 'error' && 
        !msg.text().includes('defaultProps') && 
        !msg.text().includes('unique "key" prop')) {
      console.error('Console error:', msg.text());
      hasErrors = true;
    }
  });
  
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
    hasErrors = true;
  });
  
  // Test each MDX documentation page
  for (const mdxFile of mdxFiles) {
    const url = `http://localhost:6006/?path=/docs/${mdxFile === 'welcome' ? 'welcome' : `components-${mdxFile}`}--docs`;
    
    try {
      console.log(`Testing: ${mdxFile}.mdx`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      // Wait for content to render
      await page.waitForTimeout(1000);
      
      // Check if content is present
      const hasContent = await page.evaluate(() => {
        const docRoot = document.querySelector('#storybook-docs, #docs-root, .sbdocs, main');
        if (!docRoot) return false;
        
        const text = docRoot.innerText || docRoot.textContent || '';
        return text.trim().length > 0;
      });
      
      if (hasContent) {
        console.log(`✓ ${mdxFile}.mdx rendered successfully`);
        results.push({ file: mdxFile, status: 'success' });
      } else {
        console.error(`✗ ${mdxFile}.mdx failed to render content`);
        results.push({ file: mdxFile, status: 'no content' });
        hasErrors = true;
      }
    } catch (error) {
      console.error(`✗ ${mdxFile}.mdx failed: ${error.message}`);
      results.push({ file: mdxFile, status: 'error', error: error.message });
      hasErrors = true;
    }
  }
  
  await browser.close();
  
  // Summary
  console.log('\n=== Test Summary ===');
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.length - successful;
  
  console.log(`Total: ${results.length} MDX files`);
  console.log(`Passed: ${successful}`);
  console.log(`Failed: ${failed}`);
  
  if (hasErrors) {
    console.error('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All MDX documentation pages rendered successfully');
  }
}

// Run the test
testStorybookDocs().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});