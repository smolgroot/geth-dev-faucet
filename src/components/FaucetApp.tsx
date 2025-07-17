import React, { useState, useCallback, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Slider,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Avatar,
  Fade,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import { 
  WaterDrop, 
  Send, 
  Cable, 
  Person, 
  Search, 
  Settings, 
  Save, 
  RestartAlt,
  ContentCopy,
  CheckCircle,
} from '@mui/icons-material'
import confetti from 'canvas-confetti'
import { ethers } from 'ethers'

interface TransactionResult {
  success: boolean
  message: string
  txHash?: string
}

interface ENSProfile {
  address: string
  avatar?: string
  displayName?: string
  description?: string
}

const FaucetApp: React.FC = () => {
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TransactionResult | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState<number | null>(null)
  const [networkName, setNetworkName] = useState<string | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(true)
  const [ensProfile, setEnsProfile] = useState<ENSProfile | null>(null)
  const [isResolvingENS, setIsResolvingENS] = useState(false)
  const [ensError, setEnsError] = useState<string | null>(null)
  
  // RPC Settings with localStorage persistence
  const [rpcHost, setRpcHost] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('faucet-rpc-host') || 'localhost'
    }
    return 'localhost'
  })
  const [rpcPort, setRpcPort] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('faucet-rpc-port') || '8545'
    }
    return '8545'
  })
  const [useHttps, setUseHttps] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('faucet-use-https') === 'true'
    }
    return false
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tempRpcHost, setTempRpcHost] = useState('localhost')
  const [tempRpcPort, setTempRpcPort] = useState('8545')
  const [tempUseHttps, setTempUseHttps] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  
  // Get current RPC URL
  const getRpcUrl = useCallback(() => {
    const protocol = useHttps ? 'https' : 'http'
    const portSuffix = rpcPort ? `:${rpcPort}` : ''
    return `${protocol}://${rpcHost}${portSuffix}`
  }, [useHttps, rpcPort, rpcHost])

  // Check if running in production environment
  const isProductionEnv = () => {
    if (typeof window === 'undefined') return false
    return window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1' &&
           !window.location.hostname.includes('192.168.') &&
           !window.location.hostname.includes('10.') &&
           !window.location.hostname.includes('172.')
  }

  // Check if using localhost RPC in production
  const isLocalhostInProduction = () => {
    return isProductionEnv() && (rpcHost === 'localhost' || rpcHost === '127.0.0.1')
  }

  // Copy geth command to clipboard
  const copyGethCommand = async () => {
    const command = 'geth --dev --http --http.api eth,web3,dev --http.corsdomain "*"'
    try {
      await navigator.clipboard.writeText(command)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  // Test RPC connection
  const testConnection = useCallback(async () => {
    setIsTestingConnection(true)
    setIsConnected(false)
    setChainId(null)
    setNetworkName(null)

    try {
      const provider = new ethers.JsonRpcProvider(getRpcUrl())
      
      // Test connection with timeout
      const network = await Promise.race([
        provider.getNetwork(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ])

      if (network) {
        setIsConnected(true)
        setChainId(Number(network.chainId))
        
        // Map chain ID to network name
        const chainIdToName: Record<number, string> = {
          1: 'Ethereum Mainnet',
          11155111: 'Sepolia Testnet',
          5: 'Goerli Testnet',
          1337: 'Local Geth Dev',
          31337: 'Hardhat Local',
          80001: 'Polygon Mumbai',
          421614: 'Arbitrum Sepolia',
          11155420: 'Optimism Sepolia',
          84532: 'Base Sepolia'
        }
        
        setNetworkName(chainIdToName[Number(network.chainId)] || `Chain ${network.chainId}`)
      }
    } catch (error) {
      console.log('Connection test failed:', error)
      setIsConnected(false)
    } finally {
      setIsTestingConnection(false)
    }
  }, [getRpcUrl])

  // Settings functions
  const handleSettingsOpen = () => {
    setTempRpcHost(rpcHost)
    setTempRpcPort(rpcPort)
    setTempUseHttps(useHttps)
    setSettingsOpen(true)
  }

  const handleSettingsClose = () => {
    setSettingsOpen(false)
  }

  const handleSettingsSave = () => {
    setRpcHost(tempRpcHost)
    setRpcPort(tempRpcPort)
    setUseHttps(tempUseHttps)
    
    // Persist settings to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('faucet-rpc-host', tempRpcHost)
      localStorage.setItem('faucet-rpc-port', tempRpcPort)
      localStorage.setItem('faucet-use-https', tempUseHttps.toString())
    }
    
    // Connection will be tested automatically via useEffect
    setSettingsOpen(false)
  }

  const handleSettingsReset = () => {
    setTempRpcHost('localhost')
    setTempRpcPort('8545')
    setTempUseHttps(false)
  }

  // Preset configurations
  const handlePresetSelect = (preset: string) => {
    switch (preset) {
      case 'localhost':
        setTempRpcHost('localhost')
        setTempRpcPort('8545')
        setTempUseHttps(false)
        break
      case 'sepolia':
        setTempRpcHost('sepolia.infura.io/v3/YOUR_PROJECT_ID')
        setTempRpcPort('')
        setTempUseHttps(true)
        break
      case 'sepolia-public':
        setTempRpcHost('rpc.sepolia.org')
        setTempRpcPort('')
        setTempUseHttps(true)
        break
      case 'goerli':
        setTempRpcHost('goerli.infura.io/v3/YOUR_PROJECT_ID')
        setTempRpcPort('')
        setTempUseHttps(true)
        break
      case 'goerli-public':
        setTempRpcHost('rpc.goerli.mudit.blog')
        setTempRpcPort('')
        setTempUseHttps(true)
        break
      case 'polygon-mumbai':
        setTempRpcHost('polygon-mumbai.infura.io/v3/YOUR_PROJECT_ID')
        setTempRpcPort('')
        setTempUseHttps(true)
        break
      case 'polygon-mumbai-public':
        setTempRpcHost('rpc.ankr.com/polygon_mumbai')
        setTempRpcPort('')
        setTempUseHttps(true)
        break
      case 'arbitrum-sepolia':
        setTempRpcHost('sepolia-rollup.arbitrum.io/rpc')
        setTempRpcPort('')
        setTempUseHttps(true)
        break
      case 'optimism-sepolia':
        setTempRpcHost('sepolia.optimism.io')
        setTempRpcPort('')
        setTempUseHttps(true)
        break
      case 'base-sepolia':
        setTempRpcHost('sepolia.base.org')
        setTempRpcPort('')
        setTempUseHttps(true)
        break
      default:
        break
    }
  }

  // Validate Ethereum address
  const isValidAddress = (addr: string): boolean => {
    try {
      return ethers.isAddress(addr)
    } catch {
      return false
    }
  }

  // Check if input is an ENS name
  const isENSName = (input: string): boolean => {
    return input.endsWith('.eth') && input.length > 4
  }

  // Resolve ENS name and get profile
  const resolveENS = async (ensName: string) => {
    setIsResolvingENS(true)
    setEnsError(null)
    setEnsProfile(null)

    try {
      // For ENS resolution, we MUST use mainnet - ENS contracts don't exist on local networks
      // Using multiple fallback providers for better reliability
      const providers = [
        'https://cloudflare-eth.com',
        'https://eth.llamarpc.com',
        'https://1rpc.io/eth'
      ]
      
      let mainnetProvider: ethers.JsonRpcProvider | null = null
      let resolvedAddress: string | null = null
      
      // Try providers until one works
      for (const providerUrl of providers) {
        try {
          mainnetProvider = new ethers.JsonRpcProvider(providerUrl)
          
          // Test connection and resolve ENS name
          await mainnetProvider.getNetwork() // Test connection
          resolvedAddress = await mainnetProvider.resolveName(ensName)
          
          if (resolvedAddress) {
            break // Success, exit loop
          }
        } catch (error) {
          console.log(`Provider ${providerUrl} failed, trying next...`, error)
          continue
        }
      }
      
      if (!mainnetProvider || !resolvedAddress) {
        throw new Error(`Could not resolve ENS name: ${ensName}. Make sure you have internet connectivity.`)
      }

      // Get ENS profile data
      const resolver = await mainnetProvider.getResolver(ensName)
      
      const profile: ENSProfile = {
        address: resolvedAddress,
      }

      if (resolver) {
        // Get avatar with better error handling
        try {
          const avatar = await resolver.getAvatar()
          if (avatar) {
            Object.assign(profile, { avatar: avatar.toString() })
          }
        } catch (error) {
          console.log('No avatar found or error retrieving avatar:', error)
        }

        // Get display name
        try {
          const displayName = await resolver.getText('display')
          if (displayName) {
            Object.assign(profile, { displayName })
          }
        } catch (error) {
          console.log('No display name found:', error)
        }

        // Get description
        try {
          const description = await resolver.getText('description')
          if (description) {
            Object.assign(profile, { description })
          }
        } catch (error) {
          console.log('No description found:', error)
        }
      }

      setEnsProfile(profile)
      // Don't automatically set the address to resolved address, 
      // keep the original ENS name in the input for better UX
      
    } catch (error) {
      let errorMessage = 'Failed to resolve ENS name'
      
      if (error instanceof Error) {
        if (error.message.includes('missing revert data') || error.message.includes('CALL_EXCEPTION')) {
          errorMessage = 'ENS resolution requires internet connection to mainnet. Please check your connection.'
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error: Unable to connect to Ethereum mainnet for ENS resolution.'
        } else {
          errorMessage = error.message
        }
      }
      
      setEnsError(errorMessage)
      console.error('ENS resolution error:', error)
    } finally {
      setIsResolvingENS(false)
    }
  }

  // Handle address input change with ENS resolution
  useEffect(() => {
    if (isENSName(address)) {
      const timeoutId = setTimeout(() => {
        resolveENS(address)
      }, 800)
      
      return () => clearTimeout(timeoutId)
    } else {
      setEnsProfile(null)
      setEnsError(null)
    }
  }, [address])

  // Test connection on page load and when RPC settings change
  useEffect(() => {
    testConnection()
  }, [testConnection])

  // Handle address input change
  const handleAddressChange = (value: string) => {
    setAddress(value)
    setEnsProfile(null)
    setEnsError(null)
  }

  // Enhanced address validation that considers ENS
  const isValidInput = (input: string): boolean => {
    if (input === '') return false
    
    // If it's a regular address, validate it
    if (isValidAddress(input)) return true
    
    // If it's an ENS name, check if we have a resolved profile or if it's still resolving
    if (isENSName(input)) {
      return true // Allow ENS names even if not yet resolved
    }
    
    return false
  }

  // Check if we can proceed with transaction
  const canSendTransaction = (): boolean => {
    if (!address) return false
    
    // If it's a regular address, we're good
    if (isValidAddress(address)) return true
    
    // If it's an ENS name, we need a successful resolution
    if (isENSName(address)) {
      return !!ensProfile && !ensError && !isResolvingENS
    }
    
    return false
  }

  // Trigger confetti animation
  const triggerConfetti = useCallback(() => {
    const colors = ['#00d2ff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    })
    
    // Second burst
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      })
    }, 250)
    
    // Third burst
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      })
    }, 400)
  }, [])

  // Send ETH transaction
  const sendETH = async () => {
    // Use the resolved address from ENS profile, or the input address if it's a regular address
    const targetAddress = ensProfile?.address || (isValidAddress(address) ? address : '')
    
    if (!isValidAddress(targetAddress)) {
      setResult({
        success: false,
        message: 'Please enter a valid Ethereum address or resolve a valid ENS name first',
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      // Connect to local geth instance using configurable RPC
      const provider = new ethers.JsonRpcProvider(getRpcUrl())
      
      // Get the default account (first account in geth --dev)
      const accounts = await provider.listAccounts()
      if (accounts.length === 0) {
        throw new Error('No accounts available. Make sure geth is running with --dev flag.')
      }

      // For geth --dev, we need to unlock the account or use the pre-funded account
      // The default account should have the private key available
      const signer = await provider.getSigner(0)
      
      // Check connection  
      const network = await provider.getNetwork()
      console.log('Connected to network:', network.name, 'Chain ID:', network.chainId)

      // Prepare transaction
      const tx = {
        to: targetAddress,
        value: ethers.parseEther(amount.toString()),
      }

      // Send transaction
      const transaction = await signer.sendTransaction(tx)
      
      // Wait for confirmation
      const receipt = await transaction.wait()
      
      if (receipt && receipt.status === 1) {
        // Display name priority: ENS display name > ENS input > shortened address
        const recipientDisplay = ensProfile?.displayName || 
                                (address.endsWith('.eth') ? address : `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`)
        
        setResult({
          success: true,
          message: `Successfully sent ${amount} ETH to ${recipientDisplay}`,
          txHash: transaction.hash,
        })
        triggerConfetti()
      } else {
        throw new Error('Transaction failed')
      }
      
    } catch (error) {
      console.error('Transaction error:', error)
      
      let errorMessage = 'Transaction failed'
      
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          if (isLocalhostInProduction()) {
            errorMessage = 'Cannot connect to localhost from production site. Please configure a public testnet in settings ⚙️ or run the app locally.'
          } else if (rpcHost === 'localhost') {
            errorMessage = 'Cannot connect to local geth instance. Make sure geth is running with: geth --dev --http --http.api eth,web3,dev --http.corsdomain "*"'
          } else {
            errorMessage = `Cannot connect to RPC endpoint: ${getRpcUrl()}. Check your network connection and RPC configuration.`
          }
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds in the connected account. For testnets, get ETH from a faucet first.'
        } else {
          errorMessage = error.message
        }
      }
      
      setResult({
        success: false,
        message: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Amount slider marks
  const marks = [
    { value: 0.1, label: '0.1 ETH' },
    { value: 1, label: '1 ETH' },
    { value: 5, label: '5 ETH' },
    { value: 10, label: '10 ETH' },
  ]

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, position: 'relative' }}>
          <WaterDrop sx={{ fontSize: 48, color: 'primary.main', mr: 1 }} />
          <Typography variant="h3" component="h1" sx={{ 
            background: 'linear-gradient(45deg, #00d2ff 30%, #ff6b6b 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}>
            Local GETH Faucet
          </Typography>
          
          {/* Settings Button */}
          <Tooltip title="RPC Settings">
            <IconButton
              onClick={handleSettingsOpen}
              sx={{
                position: 'absolute',
                right: 0,
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'rgba(0, 210, 255, 0.1)',
                },
              }}
            >
              <Settings />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="h6" color="text.secondary">
          Get free ETH for development on your local testnet
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          {/* Connection Status Badge */}
          <Chip
            icon={isTestingConnection ? <CircularProgress size={16} color="inherit" /> : <Cable />}
            label={
              isTestingConnection ? 
                'Testing connection...' :
                isConnected ? 
                  `Connected • ${networkName || 'Unknown Network'}${chainId ? ` (${chainId})` : ''}` :
                  `Not Connected • ${rpcHost}${rpcPort ? `:${rpcPort}` : ''}`
            }
            color={isTestingConnection ? 'default' : isConnected ? 'success' : 'warning'}
            variant="outlined"
            sx={{ maxWidth: '400px' }}
          />
          
          {/* Geth Launch Instructions - Only show for localhost when not connected */}
          {!isConnected && !isTestingConnection && (rpcHost === 'localhost' || rpcHost === '127.0.0.1') && (
            <Alert severity="info" sx={{ mt: 1, maxWidth: 600 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                🚀 <strong>Start your local geth instance:</strong>
              </Typography>
              <Box sx={{ 
                bgcolor: 'rgba(0, 0, 0, 0.1)',
                p: 1.5,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                position: 'relative',
                mt: 1
              }}>
                <Typography component="pre" sx={{ 
                  m: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  geth --dev --http --http.api eth,web3,dev --http.corsdomain "*"
                </Typography>
                <Tooltip title={copySuccess ? "Copied!" : "Copy command"}>
                  <IconButton
                    onClick={copyGethCommand}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      color: copySuccess ? 'primary.main' : 'text.secondary',
                      '&:hover': { color: 'primary.main' },
                    }}
                    size="small"
                  >
                    {copySuccess ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Alert>
          )}
          
          {/* Production Warning */}
          {isLocalhostInProduction() && (
            <Alert severity="warning" sx={{ mt: 1, maxWidth: 600 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
             <strong>Production Warning:</strong> You're trying to use localhost RPC on a production site. This won't work due to browser security restrictions.
              </Typography>
              <Typography variant="body2">
                <strong>Solutions:</strong><br />
                🔧 Click the ⚙️ settings button to configure a public testnet (Sepolia, Arbitrum, etc.)<br />
                💻 Or run this app locally on localhost for development<br />
                🌐 For production demos, use testnet RPC endpoints
              </Typography>
            </Alert>
          )}
        </Box>
      </Box>

      {/* Main Form */}
      <Card sx={{ maxWidth: 600, mx: 'auto', width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Recipient Address or ENS Name
            </Typography>
            
            {/* ENS Profile Display */}
            {ensProfile && (
              <Fade in={true}>
                <Box sx={{ 
                  mb: 2, 
                  p: 2, 
                  bgcolor: 'rgba(0, 210, 255, 0.1)', 
                  borderRadius: 2,
                  border: '1px solid rgba(0, 210, 255, 0.3)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar 
                      src={ensProfile.avatar} 
                      sx={{ width: 48, height: 48 }}
                    >
                      <Person />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {ensProfile.displayName || address}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        fontFamily: 'monospace',
                        fontSize: '0.8rem'
                      }}>
                        {ensProfile.address}
                      </Typography>
                      {ensProfile.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {ensProfile.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Fade>
            )}

            <TextField
              fullWidth
              placeholder="0x742d35Cc6634C0532925a3b8D62B8bDD65b9b22d or vitalik.eth"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              error={(address !== '' && !isValidInput(address)) || !!ensError}
              helperText={
                ensError ? `ENS Error: ${ensError}` :
                isResolvingENS ? 'Resolving ENS name...' :
                (address !== '' && !isValidInput(address))
                  ? 'Please enter a valid Ethereum address or ENS name (.eth)'
                  : ensProfile
                    ? `✅ ENS resolved to ${ensProfile.address.slice(0, 6)}...${ensProfile.address.slice(-4)}`
                    : 'Enter the Ethereum address or ENS name (.eth) to receive ETH'
              }
              InputProps={{
                sx: {
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                },
                endAdornment: isResolvingENS ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : isENSName(address) && ensProfile ? (
                  <InputAdornment position="end">
                    <Search color="success" />
                  </InputAdornment>
                ) : isENSName(address) ? (
                  <InputAdornment position="end">
                    <Search color="primary" />
                  </InputAdornment>
                ) : undefined,
              }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Amount: {amount} ETH
            </Typography>
            <Box sx={{ px: 2, mt: 2 }}>
              <Slider
                value={amount}
                onChange={(_, newValue) => setAmount(newValue as number)}
                min={0.1}
                max={10}
                step={0.1}
                marks={marks}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value} ETH`}
                sx={{
                  color: 'primary.main',
                  height: 8,
                  '& .MuiSlider-track': {
                    border: 'none',
                  },
                  '& .MuiSlider-thumb': {
                    height: 24,
                    width: 24,
                    backgroundColor: '#fff',
                    border: '2px solid currentColor',
                    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                      boxShadow: 'inherit',
                    },
                    '&:before': {
                      display: 'none',
                    },
                  },
                  '& .MuiSlider-valueLabel': {
                    lineHeight: 1.2,
                    fontSize: 12,
                    background: 'unset',
                    padding: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50% 50% 50% 0',
                    backgroundColor: 'primary.main',
                    transformOrigin: 'bottom left',
                    transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
                    '&:before': { display: 'none' },
                    '&.MuiSlider-valueLabelOpen': {
                      transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
                    },
                    '& > *': {
                      transform: 'rotate(45deg)',
                    },
                  },
                }}
              />
            </Box>
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={isLoading ? <CircularProgress size={20} /> : <Send />}
            onClick={sendETH}
            disabled={isLoading || !canSendTransaction()}
            sx={{
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(45deg, #00d2ff 30%, #0099cc 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #0099cc 30%, #007299 90%)',
              },
            }}
          >
            {isLoading ? 'Sending ETH...' : `Send ${amount} ETH`}
          </Button>

          {/* Result Display */}
          {result && (
            <Box sx={{ mt: 3 }}>
              <Alert
                severity={result.success ? 'success' : 'error'}
                sx={{
                  '& .MuiAlert-message': {
                    width: '100%',
                  },
                }}
              >
                <Typography variant="body2" sx={{ mb: result.txHash ? 1 : 0 }}>
                  {result.message}
                </Typography>
                {result.txHash && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      display: 'block',
                      mt: 1,
                      p: 1,
                      bgcolor: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: 1,
                    }}
                  >
                    TX: {result.txHash}
                  </Typography>
                )}
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onClose={handleSettingsClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          background: 'linear-gradient(45deg, #00d2ff 30%, #0099cc 90%)',
          color: 'white'
        }}>
          <Settings />
          Network & RPC Settings
        </DialogTitle>
        <DialogContent sx={{ pt: 3, mt: 5, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure your RPC endpoint. Use localhost for local development or select a testnet for production demos.
          </Typography>
          
          {/* Network Presets */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Network Presets</InputLabel>
            <Select
              value=""
              label="Network Presets"
              onChange={(e) => handlePresetSelect(e.target.value)}
            >
              <MenuItem value="localhost">🏠 Local Geth (localhost:8545)</MenuItem>
              
              {/* Ethereum Testnets */}
              <MenuItem value="sepolia">🌐 Sepolia Testnet (Infura)</MenuItem>
              <MenuItem value="sepolia-public">🌐 Sepolia Testnet (Public RPC)</MenuItem>
              <MenuItem value="goerli">🌐 Goerli Testnet (Infura)</MenuItem>
              <MenuItem value="goerli-public">🌐 Goerli Testnet (Public RPC)</MenuItem>
              
              {/* Layer 2 Testnets */}
              <MenuItem value="arbitrum-sepolia">⚡ Arbitrum Sepolia</MenuItem>
              <MenuItem value="optimism-sepolia">🔴 Optimism Sepolia</MenuItem>
              <MenuItem value="base-sepolia">🔵 Base Sepolia</MenuItem>
              
              {/* Polygon */}
              <MenuItem value="polygon-mumbai">🔷 Polygon Mumbai (Infura)</MenuItem>
              <MenuItem value="polygon-mumbai-public">🔷 Polygon Mumbai (Public RPC)</MenuItem>
            </Select>
          </FormControl>
          
          {/* Manual Configuration */}
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Manual Configuration
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={tempUseHttps}
                onChange={(e) => setTempUseHttps(e.target.checked)}
              />
            }
            label="Use HTTPS"
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Host"
              value={tempRpcHost}
              onChange={(e) => setTempRpcHost(e.target.value)}
              fullWidth
              placeholder="localhost or your-rpc-provider.com"
              helperText="Hostname, IP address, or full RPC URL"
            />
            <TextField
              label="Port"
              value={tempRpcPort}
              onChange={(e) => setTempRpcPort(e.target.value)}
              sx={{ minWidth: 120 }}
              placeholder="8545"
              helperText="Leave empty for default"
            />
          </Box>
          
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>Preview URL:</strong> {`${tempUseHttps ? 'https' : 'http'}://${tempRpcHost}${tempRpcPort ? `:${tempRpcPort}` : ''}`}
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Production Note:</strong> Localhost connections only work when running locally. 
              For production demos, use public testnets like Sepolia or Goerli.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleSettingsReset} 
            startIcon={<RestartAlt />}
            variant="outlined"
          >
            Reset to Localhost
          </Button>
          <Button onClick={handleSettingsClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSettingsSave} 
            variant="contained" 
            startIcon={<Save />}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer */}
      <Box sx={{ textAlign: 'center', mt: 4, maxWidth: 800, mx: 'auto' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          ✨ <strong>ENS Support:</strong> You can enter .eth domain names like "vitalik.eth" <br />
          The faucet will automatically resolve them and show profile information
        </Typography>

        {/* Testnet Info */}
        {rpcHost !== 'localhost' && (
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Using Public Testnet:</strong> This faucet can only send funds if you have ETH in your connected account.
            </Typography>
            <Typography variant="body2">
              For testnet ETH, visit: <br />
              • Sepolia: <a href="https://sepoliafaucet.com" target="_blank" rel="noopener">sepoliafaucet.com</a> <br />
              • Goerli: <a href="https://goerlifaucet.com" target="_blank" rel="noopener">goerlifaucet.com</a>
            </Typography>
          </Alert>
        )}
        
        {/* Code Block */}
        <Box sx={{ 
          bgcolor: '#1e1e1e',
          borderRadius: 2,
          p: 3,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'left',
          fontFamily: 'monospace',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Typography variant="body2" sx={{ 
            color: '#569cd6', 
            mb: 1,
            fontWeight: 600
          }}>
            🚀 {rpcHost === 'localhost' ? 'Start your local geth instance:' : 'For local development:'}
          </Typography>
          
          <Box sx={{ 
            bgcolor: '#0d1117',
            p: 2,
            borderRadius: 1,
            border: '1px solid rgba(255, 255, 255, 0.05)',
            position: 'relative'
          }}>
            <Typography component="pre" sx={{ 
              m: 0,
              fontSize: '0.85rem',
              lineHeight: 1.5,
              color: '#e6edf3',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              pr: 6 // Make space for copy button
            }}>
              <Box component="span" sx={{ color: '#f85149' }}>geth</Box>{' '}
              <Box component="span" sx={{ color: '#79c0ff' }}>--dev</Box>{' '}
              <Box component="span" sx={{ color: '#79c0ff' }}>--http</Box>{' '}
              <Box component="span" sx={{ color: '#79c0ff' }}>--http.api</Box>{' '}
              <Box component="span" sx={{ color: '#a5d6ff' }}>eth,web3,dev</Box>{' '}
              <Box component="span" sx={{ color: '#79c0ff' }}>--http.corsdomain</Box>{' '}
              <Box component="span" sx={{ color: '#a5d6ff' }}>"*"</Box>
            </Typography>
            
            {/* Copy Button */}
            <Tooltip title={copySuccess ? "Copied!" : "Copy command"}>
              <IconButton
                onClick={copyGethCommand}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: copySuccess ? '#58a6ff' : '#7d8590',
                  '&:hover': {
                    color: '#58a6ff',
                    backgroundColor: 'rgba(88, 166, 255, 0.1)',
                  },
                }}
                size="small"
              >
                {copySuccess ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
              </IconButton>
            </Tooltip>
            
            <Box sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              opacity: 0.7,
              fontSize: '0.7rem',
              color: '#7d8590'
            }}>
              bash
            </Box>
          </Box>
          
          <Typography variant="body2" sx={{ 
            color: '#7d8590',
            mt: 2,
            fontSize: '0.8rem'
          }}>
            💡 This starts geth in development mode with pre-funded accounts and CORS enabled for web3 access.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default FaucetApp
