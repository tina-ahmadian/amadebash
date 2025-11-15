/**
 * Verification Script for Location Tracking Implementation
 * Run this to verify all files are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Location Tracking Implementation...\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Check if file exists
function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}`);
    checks.passed++;
    return true;
  } else {
    console.log(`❌ ${description} - FILE NOT FOUND: ${filePath}`);
    checks.failed++;
    return false;
  }
}

// Check if dependency is installed
function checkDependency(packageName) {
  try {
    require.resolve(packageName);
    console.log(`✅ Package installed: ${packageName}`);
    checks.passed++;
    return true;
  } catch (e) {
    console.log(`❌ Package NOT installed: ${packageName}`);
    checks.failed++;
    return false;
  }
}

// Check if .env variable exists
function checkEnvVariable(varName) {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes(varName)) {
      console.log(`✅ Environment variable exists: ${varName}`);
      checks.passed++;
      return true;
    } else {
      console.log(`⚠️  Environment variable NOT SET: ${varName}`);
      checks.warnings++;
      return false;
    }
  } else {
    console.log(`⚠️  .env file not found - Create it from .env.example`);
    checks.warnings++;
    return false;
  }
}

console.log('📦 Checking Dependencies...');
checkDependency('@react-google-maps/api');
console.log('');

console.log('📁 Checking Core Files...');
checkFile('src/services/LocationStreamService.js', 'LocationStreamService');
checkFile('src/components/RescuerLiveMap.jsx', 'RescuerLiveMap Component');
checkFile('src/components/RescuerLocationUpdater.jsx', 'RescuerLocationUpdater Component');
console.log('');

console.log('📁 Checking Helper Files...');
checkFile('src/components/LocationTrackingDemo.jsx', 'Demo Component');
checkFile('src/components/LiveLocationIntegration.tsx', 'Integration Helpers');
console.log('');

console.log('📄 Checking Documentation...');
checkFile('src/components/LOCATION_TRACKING_README.md', 'Feature Documentation');
checkFile('INTEGRATION_GUIDE.md', 'Integration Guide');
checkFile('BACKEND_ENDPOINTS.md', 'Backend API Specification');
checkFile('LOCATION_TRACKING_SUMMARY.md', 'Summary Document');
console.log('');

console.log('🔐 Checking Environment Configuration...');
checkEnvVariable('REACT_APP_GOOGLE_MAPS_API_KEY');
console.log('');

// Summary
console.log('═══════════════════════════════════════════════════');
console.log('📊 VERIFICATION SUMMARY');
console.log('═══════════════════════════════════════════════════');
console.log(`✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);
console.log('');

if (checks.failed === 0 && checks.warnings === 0) {
  console.log('🎉 ALL CHECKS PASSED! System is ready to use.');
  console.log('');
  console.log('📖 Next Steps:');
  console.log('   1. Review INTEGRATION_GUIDE.md for setup instructions');
  console.log('   2. Add components to your dashboards');
  console.log('   3. Implement backend endpoints (see BACKEND_ENDPOINTS.md)');
} else if (checks.failed === 0) {
  console.log('⚠️  All files present, but some configuration needed:');
  console.log('');
  console.log('📝 Action Items:');
  console.log('   1. Get Google Maps API key from https://console.cloud.google.com/');
  console.log('   2. Create .env file in project root');
  console.log('   3. Add: REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key');
  console.log('   4. Restart dev server');
} else {
  console.log('❌ Some files are missing. Please check the errors above.');
  console.log('');
  console.log('🔧 Troubleshooting:');
  console.log('   - Ensure you are in the correct directory');
  console.log('   - Re-run the implementation if files are missing');
  console.log('   - Check if npm install completed successfully');
}

console.log('');
console.log('═══════════════════════════════════════════════════');

process.exit(checks.failed > 0 ? 1 : 0);

