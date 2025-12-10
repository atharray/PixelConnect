import { chromium } from 'playwright';
import { existsSync } from 'fs';

async function testDeleteLayer() {
  let browser;
  try {
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the app
    console.log('📍 Navigating to PixelConnect...');
    await page.goto('http://localhost:4173/PixelConnect/', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');
    await page.waitForTimeout(2000);
    
    // Upload the image file
    const imagePath = 'D:\\wplace\\geopixels\\Guild Templates\\Behelit_template.png';
    
    if (!existsSync(imagePath)) {
      console.error('❌ File not found:', imagePath);
      process.exit(1);
    }
    
    console.log('📤 Looking for file input...');
    
    // Find and interact with file input (more specific selector)
    const fileInputs = await page.$$('input[type="file"]');
    console.log(`Found ${fileInputs.length} file inputs`);
    
    if (fileInputs.length > 0) {
      console.log('📤 Uploading file via file input...');
      await fileInputs[0].setInputFiles(imagePath);
      console.log('✅ File selected');
      await page.waitForTimeout(2000);
    } else {
      // Try paste or drag-drop
      console.log('⚠️  No file input found, trying to find upload button...');
      const uploadButton = await page.$('button:has-text("Import")') || await page.$('button:has-text("Upload")');
      if (uploadButton) {
        console.log('Found upload button, clicking...');
        await uploadButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Wait for layer to appear
    await page.waitForTimeout(3000);
    console.log('⏳ Waiting for layer to appear...');
    
    // Take screenshot before deletion
    console.log('📸 Taking screenshot before deletion...');
    await page.screenshot({ path: 'before-delete.png' });
    console.log('✅ Screenshot saved: before-delete.png');
    
    // Find delete buttons
    const deleteButtons = await page.$$('button[title="Remove layer"]');
    console.log(`🔍 Found ${deleteButtons.length} delete button(s)`);
    
    if (deleteButtons.length > 0) {
      console.log('🗑️  Clicking delete button for first layer...');
      
      // Get layer count before
      const layersBefore = await page.$$('[class*="LayerItem"]');
      console.log(`Layers before deletion: ${layersBefore.length}`);
      
      // Click delete
      await deleteButtons[0].click();
      console.log('✅ Delete button clicked');
      
      // Wait for deletion animation
      await page.waitForTimeout(1000);
      
      // Check for any dialog/confirmation
      const dialogs = await page.$$('[role="dialog"], .swal2-modal, [class*="confirm"], [class*="alert"]');
      if (dialogs.length > 0) {
        console.log('❌ FAILED: A confirmation dialog appeared (should not happen)');
        console.log(`   Found ${dialogs.length} dialog element(s)`);
      } else {
        console.log('✅ SUCCESS: Layer deleted WITHOUT prompt');
      }
      
      // Get layer count after
      const layersAfter = await page.$$('[class*="LayerItem"]');
      console.log(`Layers after deletion: ${layersAfter.length}`);
      
      // Take final screenshot
      await page.screenshot({ path: 'after-delete.png' });
      console.log('📸 Screenshot saved: after-delete.png');
    } else {
      console.log('⚠️  No delete buttons found - layer may not have loaded');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error(error);
  } finally {
    console.log('\n🏁 Test complete. Closing browser...');
    if (browser) {
      await browser.close();
    }
  }
}

testDeleteLayer();
