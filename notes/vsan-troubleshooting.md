---
title: vSAN Troubleshooting Guide
description: Common vSAN issues and how to resolve them.
category: VMware
tags:
  - vSAN
  - troubleshooting
  - health-check
subcategory: vSAN
---

## Overview

This guide covers the most common vSAN troubleshooting scenarios.

## Health Check Failures

### Network Connectivity

Check vSAN network health:
- Verify VMkernel adapters
- Check switch configuration
- Test with `esxcli network ip connection list`

### Disk Issues

Monitor disk health:
- Check for failed disks
- Verify disk groups
- Review capacity usage

## Performance Issues

### IOPS Bottlenecks

Identify performance bottlenecks:
- Use vRealize Operations
- Check host CPU utilization
- Review storage latency

### Cache Tier Problems

Cache-related issues:
- Verify cache drive health
- Check write buffer usage
- Monitor cache hit ratio
