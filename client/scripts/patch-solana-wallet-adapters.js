const fs = require('fs')
const path = require('path')

const packageNames = [
  '@solana/wallet-adapter-base',
  '@solana/wallet-adapter-react',
  '@solana/wallet-adapter-react-ui',
  '@solana/wallet-adapter-phantom',
  '@solana/wallet-adapter-solflare',
]

const patchPackageJson = (packageName) => {
  const packageJsonPath = path.join(
    __dirname,
    '..',
    'node_modules',
    ...packageName.split('/'),
    'package.json',
  )

  if (!fs.existsSync(packageJsonPath)) {
    return
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  let changed = false

  if (packageJson.main && packageJson.module !== packageJson.main) {
    packageJson.module = packageJson.main
    changed = true
  }

  if (packageJson.exports && packageJson.exports['.']) {
    const dotExport = packageJson.exports['.']

    if (
      typeof dotExport === 'object' &&
      dotExport.require &&
      dotExport.import !== dotExport.require
    ) {
      dotExport.import = dotExport.require
      changed = true
    }
  } else if (
    packageJson.exports &&
    packageJson.exports.require &&
    packageJson.exports.import !== packageJson.exports.require
  ) {
    packageJson.exports.import = packageJson.exports.require
    changed = true
  }

  if (changed) {
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
    process.stdout.write(`patched ${packageName}\n`)
  }
}

packageNames.forEach(patchPackageJson)
