---
title: Azure Home Lab Setup
description: Build a complete Azure lab environment for testing and learning.
category: Azure
tags:
  - Azure
  - lab
  - infrastructure
createdAt: '2026-10-21T09:11:07.373Z'
updatedAt: '2026-10-21T09:25:08.786Z'
---
## Prerequisites

*   Azure subscription
    
*   Azure CLI installed
    
*   Basic networking knowledge
    

## Architecture

### Virtual Network

Create a virtual network with:

*   Address space: 10.0.0.0/16
    
*   Subnets for different workloads
    
*   Network security groups
    

### Virtual Machines

Deploy VMs for:

*   Domain controller
    
*   File server
    
*   Web server
    
*   Management workstation
    

## Setup Steps

### Step 1: Create Resource Group

```
az group create --name my-lab-rg --location eastus
```

### Step 2: Create Virtual Network

```
az network vnet create \
  --resource-group my-lab-rg \
  --name lab-vnet \
  --address-prefixes 10.0.0.0/16
```

### Step 3: Deploy VMs

Use Azure Portal or CLI to deploy virtual machines with appropriate sizing.

## Cost Management

*   Use Azure reservations
    
*   Enable auto-shutdown
    
*   Monitor usage with Azure Cost Management
