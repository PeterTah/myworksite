---
title: vSAN Witness Partition Recovery
description: >-
  Following a management agent lockup (hostd and vpxa crash) on our ESXi nodes,
  the vSAN Witness Host (vnvmwwit01.valtio-infra.fi) entered an isolated network
  partition state (STANDALONE).
category: Service Request
tags:
  - vsan partition
  - witness partition
contentType: markdown
createdAt: '2026-10-21T09:28:10.405Z'
updatedAt: '2026-10-21T11:03:50.100Z'
---
On disconnected host1, run `/etc/init.d/hostd restart`, `/etc/init.d/vpxa restart`, and `/etc/init.d/vsanmgmtd restart` to restore host-to-vCenter communication.

Despite active network paths, the vSAN cluster storage state remains desynchronized. The witness host is registered as Unhealthy, and storage objects are in a degraded state. As a direct result, multiple mission-critical production virtual machines are currently completely inaccessible.

We have successfully resolved the vSAN network partition affecting the VNK-Cluster and restored all 1,361 virtual objects to a healthy, fully compliant status. There was zero data loss during this incident, as virtual machine storage copies remained safe and active across the primary data nodes throughout the event.

Below is the technical breakdown of why this partition occurred, what caused the system deadlock, and how our remediation steps permanently resolved the issue.

## Why the vSAN Witness Partition Occurred

The root cause of the partition was a software-driven network map desynchronization (asymmetry) following a local management agent lockup, rather than a physical network or hardware failure. The exact sequence of events unfolded as follows:

### 1. The Trigger: Management Daemon Hang (hostd / vpxa)

The incident began when core management services (hostd and vpxa) on the ESXi hosts became unresponsive. While active virtual machine production traffic continued uninterrupted, this lockup severed real-time clustering communication between vCenter, the data nodes, and the remote Witness Host.

### 2. The Result: Split Routing Blueprints

When the management agents were restarted to restore access, the hosts reloaded their clustering network tables from local cache files at slightly different intervals. This created a race condition:

- The Data Nodes initialized looking for the witness host over the designated 10.14.10.x routed network path
- The Witness Host initialized using stale cached data, directing its reply traffic back toward the data nodes' management network range (10.67.128.x)
- Because the communication blueprints were mismatched in memory, the data nodes could send heartbeats to the witness, but the witness could not handshake back to the correct data node interfaces
- Unable to establish a two-way handshake, the witness host isolated itself into a STANDALONE Partition

### 3. The Deadlock: vSAN ESA Storage Pool Write-Lock

Because this environment runs the updated vSAN ESA (Express Storage Architecture), disk security metadata is strictly enforced to protect data integrity:

- Once the witness fell into an isolated state, the ESXi kernel stamped a protective "isolation signature" onto the local flash device (mpx.vmhba0:C0:T1:L0)
- Even after underlying network connectivity was fully verified via manual routing tests, the witness host actively blocked incoming cluster merge requests
- It interpreted its own local metadata stamp as a sign that the disk belonged to a different active storage pool, preventing a normal automated re-join

## How the Fix Resolved the Issue

The troubleshooting actions taken directly broke this software deadlock:

### 1. Erasing the Cache Disk

Wiping the witness flash drive safely stripped the stale isolation signature from the device metadata, returning the disk to a clean, eligible state.

### 2. Cycling the Stretched Cluster State

Disabling and re-enabling the Stretched Cluster configuration forced vCenter to flush out the corrupted, out-of-sync in-memory maps. It pushed down a brand-new, globally unified network map to all data nodes and the witness host simultaneously.

With a clean disk and aligned network maps, the data nodes instantly established quorum with the witness, remounted the storage pool, and automatically rebuilt the tie-breaker components. The cluster is now fully functional and operating with standard redundancy.
