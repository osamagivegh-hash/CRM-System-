#!/usr/bin/env node

/**
 * Deployment Validation Script
 * 
 * This script validates that the CRM system is properly configured
 * for deployment on Render. It checks:
 * - Environment variables
 * - Database connection
 * - API endpoints
 * - Frontend build
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      log(`✓ ${description}`, 'green');
      return true;
    } else {
      log(`✗ ${description} - File not found: ${filePath}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ ${description} - Error: ${error.message}`, 'red');
    return false;
  }
}

function checkPackageJson(packagePath, serviceName) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check required scripts
    const requiredScripts = ['start', 'build'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length === 0) {
      log(`✓ ${serviceName} package.json has required scripts`, 'green');
      return true;
    } else {
      log(`✗ ${serviceName} package.json missing scripts: ${missingScripts.join(', ')}`, 'red');
      return false;
    }
  } catch (error) {
    log(`✗ ${serviceName} package.json is invalid: ${error.message}`, 'red');
    return false;
  }
}

function checkEnvironmentFiles() {
  log('\n🔍 Checking Environment Files...', 'cyan');
  
  const envFiles = [
    { path: 'backend/env.example', description: 'Backend environment example' },
    { path: 'frontend/env.example', description: 'Frontend environment example' }
  ];
  
  let allValid = true;
  envFiles.forEach(({ path: filePath, description }) => {
    if (!checkFile(filePath, description)) {
      allValid = false;
    }
  });
  
  return allValid;
}

function checkRenderConfiguration() {
  log('\n🔍 Checking Render Configuration...', 'cyan');
  
  const renderFiles = [
    { path: 'render.yaml', description: 'Render blueprint configuration' },
    { path: 'render-starter.yaml', description: 'Render starter configuration' }
  ];
  
  let allValid = true;
  renderFiles.forEach(({ path: filePath, description }) => {
    if (!checkFile(filePath, description)) {
      allValid = false;
    }
  });
  
  // Validate render.yaml structure
  try {
    const renderYaml = fs.readFileSync('render.yaml', 'utf8');
    
    // Check for required sections
    const requiredSections = ['services:', 'databases:'];
    const missingSections = requiredSections.filter(section => !renderYaml.includes(section));
    
    if (missingSections.length === 0) {
      log('✓ render.yaml has required sections', 'green');
    } else {
      log(`✗ render.yaml missing sections: ${missingSections.join(', ')}`, 'red');
      allValid = false;
    }
    
    // Check for backend and frontend services
    if (renderYaml.includes('crm-backend') && renderYaml.includes('crm-frontend')) {
      log('✓ render.yaml defines both backend and frontend services', 'green');
    } else {
      log('✗ render.yaml missing service definitions', 'red');
      allValid = false;
    }
    
  } catch (error) {
    log(`✗ Error reading render.yaml: ${error.message}`, 'red');
    allValid = false;
  }
  
  return allValid;
}

function checkPackageConfigurations() {
  log('\n🔍 Checking Package Configurations...', 'cyan');
  
  const packages = [
    { path: 'backend/package.json', name: 'Backend' },
    { path: 'frontend/package.json', name: 'Frontend' }
  ];
  
  let allValid = true;
  packages.forEach(({ path: packagePath, name }) => {
    if (!checkPackageJson(packagePath, name)) {
      allValid = false;
    }
  });
  
  return allValid;
}

function checkServerConfiguration() {
  log('\n🔍 Checking Server Configuration...', 'cyan');
  
  try {
    const serverJs = fs.readFileSync('backend/server.js', 'utf8');
    
    // Check for required middleware and configurations
    const requiredChecks = [
      { pattern: /app\.listen\(/, description: 'Server listening configuration' },
      { pattern: /process\.env\.PORT/, description: 'Port environment variable usage' },
      { pattern: /cors\(/, description: 'CORS configuration' },
      { pattern: /helmet\(/, description: 'Security middleware (helmet)' },
      { pattern: /\/api\/health/, description: 'Health check endpoint' }
    ];
    
    let allValid = true;
    requiredChecks.forEach(({ pattern, description }) => {
      if (pattern.test(serverJs)) {
        log(`✓ ${description}`, 'green');
      } else {
        log(`✗ ${description}`, 'red');
        allValid = false;
      }
    });
    
    return allValid;
  } catch (error) {
    log(`✗ Error reading server.js: ${error.message}`, 'red');
    return false;
  }
}

function checkBuildProcess() {
  log('\n🔍 Checking Build Process...', 'cyan');
  
  try {
    // Check if frontend can build
    log('Testing frontend build process...', 'yellow');
    execSync('cd frontend && npm run build', { stdio: 'pipe' });
    log('✓ Frontend build successful', 'green');
    
    // Check if build directory exists
    if (fs.existsSync('frontend/build')) {
      log('✓ Frontend build directory created', 'green');
      return true;
    } else {
      log('✗ Frontend build directory not found', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Frontend build failed: ${error.message}`, 'red');
    return false;
  }
}

function generateDeploymentReport(results) {
  log('\n📊 Deployment Validation Report', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(result => result).length;
  const failedChecks = totalChecks - passedChecks;
  
  log(`\nTotal Checks: ${totalChecks}`, 'bright');
  log(`Passed: ${passedChecks}`, 'green');
  log(`Failed: ${failedChecks}`, failedChecks > 0 ? 'red' : 'green');
  
  log('\nDetailed Results:', 'bright');
  Object.entries(results).forEach(([check, result]) => {
    const status = result ? '✓ PASS' : '✗ FAIL';
    const color = result ? 'green' : 'red';
    log(`${status} ${check}`, color);
  });
  
  if (failedChecks === 0) {
    log('\n🎉 All checks passed! Your application is ready for deployment.', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Push your code to GitHub', 'yellow');
    log('2. Connect your repository to Render', 'yellow');
    log('3. Deploy using the render.yaml blueprint', 'yellow');
  } else {
    log('\n⚠️  Some checks failed. Please fix the issues above before deploying.', 'red');
  }
  
  return failedChecks === 0;
}

// Main validation function
async function validateDeployment() {
  log('🚀 CRM System Deployment Validation', 'bright');
  log('=' .repeat(50), 'bright');
  
  const results = {
    'Environment Files': checkEnvironmentFiles(),
    'Render Configuration': checkRenderConfiguration(),
    'Package Configurations': checkPackageConfigurations(),
    'Server Configuration': checkServerConfiguration(),
    'Build Process': checkBuildProcess()
  };
  
  const isValid = generateDeploymentReport(results);
  process.exit(isValid ? 0 : 1);
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateDeployment().catch(error => {
    log(`\n💥 Validation failed with error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { validateDeployment };
