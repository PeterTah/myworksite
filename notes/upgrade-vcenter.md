---
title: Upgrade - VCENTER
description: ''
category: VMware
subcategory: vCenter
tags:
  - vCenter
  - upgrade
contentType: html
createdAt: '2026-10-21T14:49:40.265Z'
updatedAt: '2026-10-21T14:53:16.407Z'
---
<h2><strong>Progress Messages: </strong></h2><p>VCENTER kp-w3-vc upgrade failed due to errors. This Supervisor Cluster is running an unsupported Kubernetes version and becomes incompatible after the vCenter Server upgrade: { 7776768d-ffc8-44bf-95bc-7295cd44f32c:v1.24.9+vmware.1-vsc0.1.4-21450065 } in the bundle precheck.</p><h3><strong>Observation:</strong></h3><ul><li><p>• The management domain has already been upgraded to 5.2.1.</p></li><li><p>• The customer has 2 clusters running Tanzu with supervisor version 1.24.</p></li><li><p>• The SDDC manager upgrade pre-check is also showing the same error.</p></li></ul><h3><strong>Action Plan:</strong></h3><ol><li><p>Follow KB Upgrading SDDC to 5.2 when vCenter is running on Version vCenter 8.0u1 build 24005165 with Tanzu: <a target="_blank" rel="noopener noreferrer nofollow" href="https://knowledge.broadcom.com/external/article/377913/upgrading-sddc-to-52-when-vcenter-is-run.html">https://knowledge.broadcom.com/external/article/377913/upgrading-sddc-to-52-when-vcenter-is-run.html</a></p></li></ol><ul><li><p>As per Broadcom KB 377913, vCenter needs to be upgraded via VAMI to target version 8.0.U3C. Thereafter, the Autoupgrade function should kick in for the TANZU Supervisor Cluster and will upgrade it to 1.26.</p></li></ul><ol start="2"><li><p>Provided customer with a link to download vCenter 8.0 U3c 8.0.3.00300-24305161: <a target="_blank" rel="noopener noreferrer nofollow" href="https://support.broadcom.com/web/ecx/solutiondetails?patchId=5534">https://support.broadcom.com/web/ecx/solutiondetails?patchId=5534</a></p></li></ol><ul><li><p>Follow this KB to patch vCenter via VAMI to target version: Patching/Updating VMware vCenter Server Appliance VCSA and Platform Service Controller PSC through Appliance Management Interface VAMI <a target="_blank" rel="noopener noreferrer nofollow" href="https://knowledge.broadcom.com/external/article/316584/patchingupdating-vmware-vcenter-server-a.html">https://knowledge.broadcom.com/external/article/316584/patchingupdating-vmware-vcenter-server-a.html</a></p></li></ul><ol start="3"><li><p>Working together with RPS, the customer wants to start the vCenter VAMI upgrade tomorrow at 09:00 Abu Dhabi time (5 am UK time).</p></li></ol><ul><li><p>We will be turning over the SR to APJ DE to assist with the upgrade at 09:00 Abu Dhabi time.</p></li></ul><p></p>
