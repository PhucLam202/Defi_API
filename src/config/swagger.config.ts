import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "🚀 LiquidSync API - DeFi Data Aggregation",
      version: "1.0.0",
      description: `
# Welcome to LiquidSync API

**Next-generation DeFi data aggregation bridging Polkadot & Ethereum ecosystems**

## 🌟 Project Overview

LiquidSync is a comprehensive DeFi data aggregation API that bridges the gap between **Polkadot's parachain ecosystem** and **Ethereum's liquid staking infrastructure**. Our platform provides developers with real-time, normalized data from multiple protocols, enabling seamless integration of cross-chain DeFi functionality.

### 🎯 Mission
To democratize access to DeFi data across chains, empowering developers to build sophisticated applications without the complexity of managing multiple protocol integrations.

---

## 🔥 Key Features

### 🔗 Cross-Chain Data Aggregation
- **Polkadot Ecosystem**: Bifrost, Acala, Moonbeam, Astar
- **Ethereum LST**: Lido, Rocket Pool, Frax, Coinbase
- **15+ protocols** with real-time synchronization
- Unified data schema across all chains

### 📊 Comprehensive Yield Intelligence
- Real-time APY/APR calculations with detailed breakdown
- Historical yield trends and performance analytics
- Risk-adjusted returns with safety scores
- Cross-chain yield comparison tools

### 💰 Advanced Liquid Staking Focus
- LST token tracking across chains (vDOT, stETH, rETH)
- Staking derivative analytics with validator data
- Liquid staking ratio and market dominance metrics
- Cross-chain LST arbitrage opportunities

### 🛠️ Developer-First Design
- RESTful API with OpenAPI 3.0 specification
- TypeScript SDK with full type safety
- Real-time WebSocket feeds for live data
- Comprehensive documentation with code examples

---

## 🚀 Quick Start

### Essential Endpoints
1. **All Stablecoins**: \`GET /api/v1/stablecoins\` - Comprehensive stablecoin data
2. **Stablecoin by Symbol**: \`GET /api/v1/stablecoins/symbol/USDT\` - Specific token info
3. **Yield Data**: \`GET /api/v1/yields\` - Cross-chain yield opportunities

### Example Usage
\`\`\`bash
# Get all stablecoins with market data
curl -X GET "http://localhost:3000/api/v1/stablecoins" \\
  -H "Accept: application/json"

# Get specific stablecoin by symbol
curl -X GET "http://localhost:3000/api/v1/stablecoins/symbol/USDT" \\
  -H "Accept: application/json"
\`\`\`

---

## 🏗️ Technical Architecture

### Backend Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: PostgreSQL + Redis caching layer
- **Processing**: Bull.js for background job processing
- **Monitoring**: Prometheus + Grafana integration

### Data Sources
- Bifrost API • Ethereum RPCs • TheGraph Endpoints
- CoinGecko Prices • DeFiLlama Data • Substrate RPCs

### Caching Strategy
- **Price Data**: 30-second cache
- **Pool Data**: 2-minute cache
- **Historical Data**: 1-hour cache
- **Protocol Metadata**: 24-hour cache

---

## 👥 Target Audience

- **DeFi Application Developers** building yield farming platforms
- **Portfolio Management Tools** requiring multi-chain data
- **Institutional Players** needing reliable DeFi infrastructure
- **Research Platforms** analyzing cross-chain yield opportunities
- **Trading Bots** executing cross-chain arbitrage strategies

---

## 📚 Additional Resources

- **Interactive Documentation**: Available at \`/docs\` (this page)
- **API Information**: Detailed specs at \`/api/info\`
- **GitHub Repository**: [View Source Code](https://github.com/PhucLam202/defi-data-api)

---

*Built with ❤️ for the DeFi community*
      `,
      contact: {
        name: "LiquidSync API Team",
        url: "https://github.com/PhucLam202/defi-data-api",
        email: "support@liquidsync.dev"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    tags: [
      {
        name: "Stablecoins",
        description: "Comprehensive stablecoin data across multiple chains with market analytics, circulation data, and risk metrics"
      },
      {
        name: "Yields",
        description: "Cross-chain yield data and DeFi protocol analytics"
      },
      {
        name: "Analytics",
        description: "Advanced analytics and market intelligence"
      }
    ],
    externalDocs: {
      description: "Find more information and API guides",
      url: "https://github.com/PhucLam202/defi-data-api"
    }
  },
  apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts"],
};

export const specs = swaggerJSDoc(options);
