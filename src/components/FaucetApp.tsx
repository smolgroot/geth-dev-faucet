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
} from '@mui/material'
import { WaterDrop, Send, Cable, Person, Search, Settings, Save, RestartAlt } from '@mui/icons-material'
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
  const [ensProfile, setEnsProfile] = useState<ENSProfile | null>(null)
  const [isResolvingENS, setIsResolvingENS] = useState(false)
  const [ensError, setEnsError] = useState<string | null>(null)
  
  // RPC Settings
  const [rpcHost, setRpcHost] = useState('localhost')
  const [rpcPort, setRpcPort] = useState('8545')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tempRpcHost, setTempRpcHost] = useState('localhost')
  const [tempRpcPort, setTempRpcPort] = useState('8545')
  
  // Get current RPC URL
  const getRpcUrl = () => `http://${rpcHost}:${rpcPort}`

  // Settings functions
  const handleSettingsOpen = () => {
    setTempRpcHost(rpcHost)
    setTempRpcPort(rpcPort)
    setSettingsOpen(true)
  }

  const handleSettingsClose = () => {
    setSettingsOpen(false)
  }

  const handleSettingsSave = () => {
    setRpcHost(tempRpcHost)
    setRpcPort(tempRpcPort)
    setIsConnected(false) // Reset connection status
    setSettingsOpen(false)
  }

  const handleSettingsReset = () => {
    setTempRpcHost('localhost')
    setTempRpcPort('8545')
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
      setIsConnected(true)
      
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
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed. Make sure geth is running locally on port 8545.'
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
        <Box sx={{ mt: 2 }}>
          <Chip
            icon={<Cable />}
            label={isConnected ? `Connected to ${rpcHost}:${rpcPort}` : `Not Connected (${rpcHost}:${rpcPort})`}
            color={isConnected ? 'success' : 'warning'}
            variant="outlined"
          />
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
      <Dialog open={settingsOpen} onClose={handleSettingsClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          background: 'linear-gradient(45deg, #00d2ff 30%, #0099cc 90%)',
          color: 'white'
        }}>
          <Settings />
          RPC Settings
        </DialogTitle>
        <DialogContent sx={{ pt: 3, mt: 5, mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure the RPC endpoint for your local geth instance. Default is localhost:8545.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Host"
              value={tempRpcHost}
              onChange={(e) => setTempRpcHost(e.target.value)}
              fullWidth
              placeholder="localhost"
              helperText="Hostname or IP address"
            />
            <TextField
              label="Port"
              value={tempRpcPort}
              onChange={(e) => setTempRpcPort(e.target.value)}
              type="number"
              sx={{ minWidth: 120 }}
              placeholder="8545"
              helperText="Port number"
            />
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Current URL:</strong> {`http://${tempRpcHost}:${tempRpcPort}`}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={handleSettingsReset} 
            startIcon={<RestartAlt />}
            variant="outlined"
          >
            Reset to Default
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
            🚀 Start your local geth instance:
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
              wordBreak: 'break-all'
            }}>
              <Box component="span" sx={{ color: '#f85149' }}>geth</Box>{' '}
              <Box component="span" sx={{ color: '#79c0ff' }}>--dev</Box>{' '}
              <Box component="span" sx={{ color: '#79c0ff' }}>--http</Box>{' '}
              <Box component="span" sx={{ color: '#79c0ff' }}>--http.api</Box>{' '}
              <Box component="span" sx={{ color: '#a5d6ff' }}>eth,web3,personal</Box>{' '}
              <Box component="span" sx={{ color: '#79c0ff' }}>--http.corsdomain</Box>{' '}
              <Box component="span" sx={{ color: '#a5d6ff' }}>"*"</Box>
            </Typography>
            
            {/* Copy button would go here in a real implementation */}
            <Box sx={{
              position: 'absolute',
              top: 8,
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
