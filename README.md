# ET## ✨ Features

- 🎨 **Modern UI**: Beautiful Material-UI interface with dark theme and gradients
- 🔗 **Ethereum Integration**: Direct connection to local geth instance via ethers.js
- 🌐 **ENS Support**: Resolve .eth domain names with profile information display
- 👤 **Profile Pictures**: Automatic display of ENS avatar and profile metadata
- ⚙️ **Configurable RPC**: Settings modal to customize RPC host and port
- 🎯 **Address Validation**: Real-time Ethereum address and ENS name validation
- 📊 **Flexible Amounts**: Slider to select ETH amounts from 0.1 to 10 ETH
- 🎉 **Success Animations**: Confetti celebration on successful transactions
- 📱 **Responsive Design**: Works great on desktop and mobile devices
- 🚀 **SEO Optimized**: Complete meta tags, Twitter cards, and custom favicon
- ⚡ **Fast Development**: Built with Vite for lightning-fast development experienceLocal Development Tool

A beautiful and modern Ethereum faucet application built with React, TypeScript, Material-UI, and Vite. This tool allows you to easily distribute ETH from your local geth development instance to any Ethereum address.

## ✨ Features

- 🎨 **Modern UI**: Beautiful Material-UI interface with dark theme and gradients
- 🔗 **Ethereum Integration**: Direct connection to local geth instance via ethers.js
- � **ENS Support**: Resolve .eth domain names with profile information display
- 👤 **Profile Pictures**: Automatic display of ENS avatar and profile metadata
- �🎯 **Address Validation**: Real-time Ethereum address and ENS name validation
- 📊 **Flexible Amounts**: Slider to select ETH amounts from 0.1 to 10 ETH
- 🎉 **Success Animations**: Confetti celebration on successful transactions
- 📱 **Responsive Design**: Works great on desktop and mobile devices
- ⚡ **Fast Development**: Built with Vite for lightning-fast development experience

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Go Ethereum (geth)** installed on your system

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Local Geth Instance

Start your local Ethereum development node:

```bash
geth --dev --http --http.api eth,web3,personal --http.corsdomain "*"
```

This command:
- `--dev`: Runs in development mode with pre-funded accounts
- `--http`: Enables HTTP-RPC server
- `--http.api eth,web3,personal`: Enables required APIs
- `--http.corsdomain "*"`: Allows CORS from any origin

### 3. Start the Faucet Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🛠️ Usage

1. **Enter Recipient**: 
   - **Ethereum Address**: Input a valid Ethereum address (0x...)
   - **ENS Domain**: Enter a .eth domain name (e.g., vitalik.eth, ens.eth)
2. **ENS Resolution**: If you enter a .eth name, the app will:
   - Automatically resolve it to an Ethereum address
   - Display the ENS profile picture (avatar) if available
   - Show the display name and description from ENS metadata
3. **Select Amount**: Use the slider to choose between 0.1 and 10 ETH
4. **Configure RPC** (Optional): Click the settings ⚙️ button to customize RPC endpoint
5. **Send ETH**: Click the "Send ETH" button to initiate the transaction
6. **Celebrate**: Watch the confetti animation on successful transactions! 🎉

### ENS Examples to Try
- `vitalik.eth` - Vitalik Buterin's ENS
- `ens.eth` - Official ENS domain
- `nick.eth` - Nick Johnson (ENS creator)
- Any other .eth domain you know!

### RPC Configuration
- Click the ⚙️ settings icon in the top-right corner
- Customize the host and port for your geth instance
- Default: `localhost:8545`
- Supports any host/port combination

## 🏗️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) v6
- **Ethereum Library**: ethers.js v6
- **Animations**: canvas-confetti
- **Styling**: Material-UI theme system with custom gradients

## 📁 Project Structure

```
src/
├── components/
│   └── FaucetApp.tsx          # Main faucet component
├── App.tsx                    # Root application component
├── main.tsx                   # Application entry point
└── index.css                  # Global styles
```

### Configuration

### Geth Connection

The application connects to `http://localhost:8545` by default for local transactions. For ENS resolution, it uses Cloudflare's public Ethereum RPC endpoint to access mainnet ENS data.

If you need to use a different local endpoint, modify the provider URL in `src/components/FaucetApp.tsx`:

```typescript
const provider = new ethers.JsonRpcProvider('http://your-endpoint:port')
```

### ENS Resolution

ENS names are resolved using Ethereum mainnet data through Cloudflare's public RPC. The app fetches:
- **Address Resolution**: Converts .eth names to Ethereum addresses
- **Avatar Images**: ENS profile pictures
- **Display Names**: Human-readable names
- **Descriptions**: Profile descriptions

### Transaction Settings

- **Default Amount Range**: 0.1 - 10 ETH
- **Network**: Local geth development network
- **Gas**: Automatically estimated by ethers.js
- **ENS Support**: Mainnet ENS resolution with local transaction execution

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Development Tips

1. Keep your geth instance running while developing
2. Use the browser's developer tools to monitor network requests
3. Check the console for detailed transaction logs

## 🐛 Troubleshooting

### Common Issues

**"Transaction failed" error**
- Ensure geth is running with the correct flags
- Verify the HTTP endpoint is accessible
- Check that CORS is properly configured

**"No accounts available" error**
- Make sure geth is started with `--dev` flag
- The development mode automatically creates a pre-funded account

**Address validation errors**
- Ensure you're entering a valid Ethereum address (starts with 0x)
- Check that the address is properly formatted (42 characters total)

**ENS resolution errors**
- **"missing revert data" or "CALL_EXCEPTION"**: This occurs when trying to resolve ENS on local network. ENS resolution requires internet connectivity to Ethereum mainnet.
- **"ENS resolution requires internet connection"**: Make sure you have internet access. ENS contracts only exist on mainnet.
- **"Network error"**: Check your internet connection and try again. The app uses multiple fallback RPC providers.
- **ENS name not found**: Verify the .eth domain exists and is properly configured.

### Logs and Debugging

The application logs detailed information to the browser console. Open Developer Tools (F12) to view:
- Transaction details
- Network connection status
- Error messages and stack traces

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Note**: This faucet is designed for development purposes only. Do not use with real mainnet ETH or in production environments.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
