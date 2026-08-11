module.exports = {
  // v3 uses its own appId (and thus its own auto-derived MSI UpgradeCode) and
  // product/install-dir name so it installs side-by-side with Freeter 1.x/2.x
  // instead of upgrading them in place.
  appId: 'io.freeter.app.v3',
  productName: 'Freeter 3',
  artifactName: 'Freeter3-${version}-${os}-${arch}.${ext}',
  directories: {
    output: 'release'
  },
  files: [
    'dist/**/*',
    '!dist/renderer/src/**',
    {
      from: './',
      to: './',
      filter: ['package.json']
    }
  ],
  mac: {
    category: 'public.app-category.productivity',
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'resources/darwin/freeter.icns',
    publish: ['github'],
  },
  dmg: {
    background: 'resources/darwin/dmgBg.png',
    icon: 'resources/darwin/freeter.icns',
    iconSize: 128,
    contents: [
      { x: 114, y: 150, type: 'file' },
      { x: 386, y: 150, type: 'link', path: '/Applications' },
    ]
  },
  win: {
    target: [
      {
        target: 'msi',
        arch: ['x64']
      },
      {
        target: 'zip',
        arch: ['x64']
      }
    ],
    icon: 'resources/win32/freeter.ico',
    publish: ['github'],
  },
  // Assisted (non-one-click) installer: installs into a "Freeter 3" folder
  // (one-click MSIs would use the package.json name "freeter" — the same
  // folder Freeter 2.x uses) and lets the user change the location.
  msi: {
    oneClick: false
  },
  linux: {
    target: [
      {
        target: 'tar.xz',
        arch: ['x64']
      }
    ],
    icon: 'resources/linux/freeter-icons',
    publish: ['github'],
  }
}
