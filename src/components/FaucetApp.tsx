import React, { useState, useCallback } from 'react'
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
} from '@mui/material'
import { WaterDrop, Send, Cable } from '@mui/icons-material'
import confetti from 'canvas-confetti'
import { ethers } from 'ethers'

interface TransactionResult {
  success: boolean
  message: string
  txHash?: string
}

const FaucetApp: React.FC = () => {
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TransactionResult | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Validate Ethereum address
  const isValidAddress = (addr: string): boolean => {
    try {
      return ethers.isAddress(addr)
    } catch {
      return false
    }
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
    if (!isValidAddress(address)) {
      setResult({
        success: false,
        message: 'Please enter a valid Ethereum address',
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      // Connect to local geth instance
      const provider = new ethers.JsonRpcProvider('http://localhost:8545')
      
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
        to: address,
        value: ethers.parseEther(amount.toString()),
      }

      // Send transaction
      const transaction = await signer.sendTransaction(tx)
      
      // Wait for confirmation
      const receipt = await transaction.wait()
      
      if (receipt && receipt.status === 1) {
        setResult({
          success: true,
          message: `Successfully sent ${amount} ETH to ${address}`,
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <WaterDrop sx={{ fontSize: 48, color: 'primary.main', mr: 1 }} />
          <Typography variant="h3" component="h1" sx={{ 
            background: 'linear-gradient(45deg, #00d2ff 30%, #ff6b6b 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}>
            ETH Faucet
          </Typography>
        </Box>
        <Typography variant="h6" color="text.secondary">
          Get free ETH for development on your local testnet
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Chip
            icon={<Cable    />}
            label={isConnected ? 'Connected to Local Geth' : 'Not Connected'}
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
              Recipient Address
            </Typography>
            <TextField
              fullWidth
              placeholder="0x742d35Cc6634C0532925a3b8D62B8bDD65b9b22d"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={address !== '' && !isValidAddress(address)}
              helperText={
                address !== '' && !isValidAddress(address)
                  ? 'Please enter a valid Ethereum address'
                  : 'Enter the Ethereum address to receive ETH'
              }
              InputProps={{
                sx: {
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                },
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
            disabled={isLoading || !isValidAddress(address)}
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

      {/* Footer */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Make sure your local geth instance is running with: <br />
          <code style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
            geth --dev --http --http.api eth,web3,personal --http.corsdomain "*"
          </code>
        </Typography>
      </Box>
    </Box>
  )
}

export default FaucetApp
