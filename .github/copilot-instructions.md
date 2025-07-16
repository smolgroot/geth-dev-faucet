# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is an Ethereum Faucet service built with React, TypeScript, Material-UI, and Vite. The application interacts with a local geth development instance to provide ETH airdrops to users.

## Key Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Material-UI (MUI)
- **Ethereum Integration**: ethers.js v6
- **Animations**: canvas-confetti
- **Development**: Local geth instance (--dev mode)

## Architecture Guidelines
- Use functional components with React hooks
- Implement proper TypeScript typing throughout
- Follow Material-UI design patterns
- Use ethers.js for all Ethereum interactions
- Handle errors gracefully with user feedback
- Implement proper form validation for ETH addresses

## Code Style
- Use arrow functions for components
- Implement proper error boundaries
- Use Material-UI's theme system
- Keep components modular and reusable
- Add proper JSDoc comments for complex functions

## Ethereum Integration
- Default RPC endpoint: http://localhost:8545 (geth --dev)
- Validate ETH addresses using ethers.js utilities
- Handle transaction errors and provide user feedback
- Use proper gas estimation for transactions
- Support amount range: 0.1 to 10 ETH
