import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { createServer as createViteServer } from 'vite';

// Initial seeds from mockDatabase
import {
  INITIAL_TENANTS,
  INITIAL_LICENSES,
  INITIAL_SETTINGS,
  INITIAL_CUSTOM_FIELDS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_CUSTOMER_PAYMENTS,
  INITIAL_SUPPLIERS,
  INITIAL_USERS,
  INITIAL_EMPLOYEES,
  INITIAL_SALARIES,
  INITIAL_ADVANCES,
  INITIAL_EXPENSES,
  INITIAL_SALES,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_PURCHASE_RETURNS,
  INITIAL_PAYOUTS,
  INITIAL_RISK_ALERTS,
  INITIAL_ADMIN_SHOP_MESSAGES,
  INITIAL_PROMOTIONS,
  INITIAL_REPAIR_JOBS,
  INITIAL_VEHICLE_SERVICE_JOBS,
  INITIAL_STOCK_ADJUSTMENTS,
  INITIAL_STOCK_AUDITS,
  INITIAL_COUNTERS,
  INITIAL_COUNTER_SHIFTS,
  INITIAL_CASH_DRAWER_TRANSACTIONS,
} from './src/data/mockDatabase';

const PORT = 3000;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'cloud_database.json');

interface CloudDatabase {
  version: number;
  lastUpdated: string;
  tenants: any[];
  licenses: Record<string, any>;
  settings: Record<string, any>;
  customFields: any[];
  categories: any[];
  products: any[];
  customers: any[];
  customerPayments: any[];
  suppliers: any[];
  users: any[];
  employees: any[];
  salaries: any[];
  advances: any[];
  expenses: any[];
  sales: any[];
  saleReturns: any[];
  purchases: any[];
  purchaseReturns: any[];
  payouts: any[];
  riskAlerts: any[];
  adminShopMessages: any[];
  promotions: any[];
  repairJobs: any[];
  vehicleServiceJobs: any[];
  stockAdjustments: any[];
  stockAudits: any[];
  counters: any[];
  counterShifts: any[];
  cashDrawerTransactions: any[];
}

function getDefaultDatabase(): CloudDatabase {
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    tenants: INITIAL_TENANTS,
    licenses: INITIAL_LICENSES,
    settings: INITIAL_SETTINGS,
    customFields: INITIAL_CUSTOM_FIELDS,
    categories: INITIAL_CATEGORIES,
    products: INITIAL_PRODUCTS,
    customers: INITIAL_CUSTOMERS,
    customerPayments: INITIAL_CUSTOMER_PAYMENTS,
    suppliers: INITIAL_SUPPLIERS,
    users: INITIAL_USERS,
    employees: INITIAL_EMPLOYEES,
    salaries: INITIAL_SALARIES,
    advances: INITIAL_ADVANCES,
    expenses: INITIAL_EXPENSES,
    sales: INITIAL_SALES,
    saleReturns: [],
    purchases: INITIAL_PURCHASE_ORDERS,
    purchaseReturns: INITIAL_PURCHASE_RETURNS,
    payouts: INITIAL_PAYOUTS,
    riskAlerts: INITIAL_RISK_ALERTS,
    adminShopMessages: INITIAL_ADMIN_SHOP_MESSAGES,
    promotions: INITIAL_PROMOTIONS,
    repairJobs: INITIAL_REPAIR_JOBS,
    vehicleServiceJobs: INITIAL_VEHICLE_SERVICE_JOBS,
    stockAdjustments: INITIAL_STOCK_ADJUSTMENTS,
    stockAudits: INITIAL_STOCK_AUDITS,
    counters: INITIAL_COUNTERS,
    counterShifts: INITIAL_COUNTER_SHIFTS,
    cashDrawerTransactions: INITIAL_CASH_DRAWER_TRANSACTIONS,
  };
}

// In-memory active database instance
let database: CloudDatabase;

function loadDatabase(): CloudDatabase {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tenants) && parsed.tenants.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load existing database file, resetting to initial seed:', err);
  }

  const initial = getDefaultDatabase();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: CloudDatabase) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

database = loadDatabase();

// Active SSE client connections for real-time synchronization across computers
type SseClient = {
  id: string;
  deviceId?: string;
  res: express.Response;
};
const sseClients: Map<string, SseClient> = new Map();

// Remote PCs & Devices Security Control Management
const DEVICES_FILE = path.join(DB_DIR, 'remote_devices.json');

export interface RemoteDeviceRecord {
  deviceId: string;
  deviceName: string;
  tenantId: string;
  shopName: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  ipAddress: string;
  locationCity?: string;
  locationCountry?: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'laptop' | 'pos_terminal' | 'tablet' | 'mobile';
  status: 'ONLINE' | 'IDLE' | 'LOCKED' | 'BLOCKED' | 'OFFLINE';
  isAuthorized: boolean;
  isLocked: boolean;
  lockReason?: string;
  lockMessage?: string;
  lastPing: string;
  connectedAt: string;
  appVersion?: string;
  pendingCommand?: 'LOCK' | 'UNLOCK' | 'FORCE_LOGOUT' | 'BLOCK' | 'UNBLOCK' | 'MESSAGE' | null;
  pendingMessage?: string;
}

function getInitialDevices(): Record<string, RemoteDeviceRecord> {
  const now = new Date().toISOString();
  return {
    'dev_colombo_pos1': {
      deviceId: 'dev_colombo_pos1',
      deviceName: 'Colombo Head POS - Terminal 01',
      tenantId: 'SHOP001',
      shopName: 'Super Fresh Mart - Colombo',
      currentUserId: 'USR001',
      currentUserName: 'Nuwan Perera',
      currentUserRole: 'Cashier',
      ipAddress: '112.134.88.24',
      locationCity: 'Colombo (Western Province)',
      locationCountry: 'Sri Lanka',
      browser: 'Chrome 124.0',
      os: 'Windows 11 Pro',
      deviceType: 'pos_terminal',
      status: 'ONLINE',
      isAuthorized: true,
      isLocked: false,
      lastPing: now,
      connectedAt: now,
      appVersion: 'v2.8.4 Enterprise',
    },
    'dev_kandy_cashier2': {
      deviceId: 'dev_kandy_cashier2',
      deviceName: 'Kandy Express Checkout 02',
      tenantId: 'SHOP001',
      shopName: 'Super Fresh Mart - Kandy Branch',
      currentUserId: 'USR002',
      currentUserName: 'Chamara Silva',
      currentUserRole: 'Cashier',
      ipAddress: '175.157.12.90',
      locationCity: 'Kandy (Central Province)',
      locationCountry: 'Sri Lanka',
      browser: 'Edge 123.0',
      os: 'Windows 10 IoT Enterprise',
      deviceType: 'pos_terminal',
      status: 'ONLINE',
      isAuthorized: true,
      isLocked: false,
      lastPing: now,
      connectedAt: now,
      appVersion: 'v2.8.4 Enterprise',
    },
    'dev_galle_manager_pc': {
      deviceId: 'dev_galle_manager_pc',
      deviceName: 'Galle Highway Store - Manager Laptop',
      tenantId: 'SHOP002',
      shopName: 'City MediCare Pharmacy',
      currentUserId: 'USR003',
      currentUserName: 'Dr. Bandara',
      currentUserRole: 'Pharmacist / Manager',
      ipAddress: '123.231.54.11',
      locationCity: 'Galle (Southern Province)',
      locationCountry: 'Sri Lanka',
      browser: 'Safari 17.2',
      os: 'macOS Sonoma',
      deviceType: 'laptop',
      status: 'ONLINE',
      isAuthorized: true,
      isLocked: false,
      lastPing: now,
      connectedAt: now,
      appVersion: 'v2.8.4 Enterprise',
    },
    'dev_jaffna_tablet': {
      deviceId: 'dev_jaffna_tablet',
      deviceName: 'Jaffna Town Branch - Stock Scanner Tablet',
      tenantId: 'SHOP003',
      shopName: 'Apex Auto Care & Spares',
      currentUserId: 'USR004',
      currentUserName: 'K. Sivakumar',
      currentUserRole: 'Inventory Officer',
      ipAddress: '112.135.201.44',
      locationCity: 'Jaffna (Northern Province)',
      locationCountry: 'Sri Lanka',
      browser: 'Chrome Mobile 123.0',
      os: 'Android 14',
      deviceType: 'tablet',
      status: 'IDLE',
      isAuthorized: true,
      isLocked: false,
      lastPing: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      connectedAt: now,
      appVersion: 'v2.8.4 Enterprise',
    },
  };
}

let remoteDevices: Map<string, RemoteDeviceRecord> = new Map();

function loadDevices(): Map<string, RemoteDeviceRecord> {
  try {
    if (fs.existsSync(DEVICES_FILE)) {
      const content = fs.readFileSync(DEVICES_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      const map = new Map<string, RemoteDeviceRecord>();
      for (const [key, val] of Object.entries(parsed)) {
        map.set(key, val as RemoteDeviceRecord);
      }
      return map;
    }
  } catch (err) {
    console.warn('Failed to load remote devices file, initializing default fleet:', err);
  }
  const defaultFleet = getInitialDevices();
  const map = new Map<string, RemoteDeviceRecord>();
  for (const [key, val] of Object.entries(defaultFleet)) {
    map.set(key, val);
  }
  saveDevices(map);
  return map;
}

function saveDevices(devices: Map<string, RemoteDeviceRecord>) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const obj: Record<string, RemoteDeviceRecord> = {};
    for (const [key, val] of devices.entries()) {
      obj[key] = val;
    }
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write devices file:', err);
  }
}

remoteDevices = loadDevices();

function broadcastSyncEvent(eventData: { version: number; lastUpdated: string; updatedCollections?: string[] }) {
  const message = `event: sync\ndata: ${JSON.stringify(eventData)}\n\n`;
  for (const [clientId, client] of sseClients.entries()) {
    try {
      client.res.write(message);
    } catch {
      sseClients.delete(clientId);
    }
  }
}

function broadcastSecurityCommand(targetDeviceId: string, command: string, payload?: any) {
  const eventPayload = {
    targetDeviceId,
    command,
    payload,
    timestamp: new Date().toISOString(),
  };
  const message = `event: security_command\ndata: ${JSON.stringify(eventPayload)}\n\n`;
  for (const [clientId, client] of sseClients.entries()) {
    try {
      // Broadcast to matching deviceId or to all if targetDeviceId === 'ALL'
      if (!targetDeviceId || targetDeviceId === 'ALL' || client.deviceId === targetDeviceId) {
        client.res.write(message);
      }
    } catch {
      sseClients.delete(clientId);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS headers for flexible multi-PC and mobile browser requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'WCS Retail Cloud Sync Server',
      connectedClients: sseClients.size,
      version: database.version,
      lastUpdated: database.lastUpdated,
      totalTenants: database.tenants.length,
      totalSales: database.sales.length,
      totalPurchases: database.purchases.length,
    });
  });

  // 1. Get current cloud database state
  app.get('/api/sync/state', (req, res) => {
    res.json({
      success: true,
      version: database.version,
      lastUpdated: database.lastUpdated,
      connectedClients: sseClients.size,
      data: database,
    });
  });

  // 2. Real-time Server-Sent Events (SSE) stream
  app.get('/api/sync/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const deviceId = (req.query.deviceId as string) || '';
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sseClients.set(clientId, { id: clientId, deviceId, res });

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, deviceId, version: database.version })}\n\n`);

    // Keep connection alive with heartbeat comment every 20 seconds
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeatInterval);
        sseClients.delete(clientId);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeatInterval);
      sseClients.delete(clientId);
    });
  });

  // 3. Post incremental or full updates from any computer
  app.post('/api/sync/update', (req, res) => {
    try {
      const { type, updates, fullDatabase } = req.body;
      const updatedKeys: string[] = [];

      if (type === 'FULL_SYNC' && fullDatabase && Array.isArray(fullDatabase.tenants)) {
        database = {
          ...fullDatabase,
          version: (database.version || 0) + 1,
          lastUpdated: new Date().toISOString(),
        };
        updatedKeys.push('all');
      } else if (updates && typeof updates === 'object') {
        const dbAny = database as Record<string, any>;
        for (const [key, value] of Object.entries(updates)) {
          if (value !== undefined) {
            dbAny[key] = value;
            updatedKeys.push(key);
          }
        }
        database.version = (database.version || 0) + 1;
        database.lastUpdated = new Date().toISOString();
      }

      saveDatabase(database);

      // Broadcast update to all other connected PCs & terminals
      broadcastSyncEvent({
        version: database.version,
        lastUpdated: database.lastUpdated,
        updatedCollections: updatedKeys,
      });

      res.json({
        success: true,
        version: database.version,
        lastUpdated: database.lastUpdated,
        updatedKeys,
      });
    } catch (err: any) {
      console.error('Sync update failed:', err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to update database' });
    }
  });

  // 4. Reset database to demo state
  app.post('/api/sync/reset', (req, res) => {
    database = getDefaultDatabase();
    database.version = (database.version || 0) + 1;
    database.lastUpdated = new Date().toISOString();
    saveDatabase(database);

    broadcastSyncEvent({
      version: database.version,
      lastUpdated: database.lastUpdated,
      updatedCollections: ['all'],
    });

    res.json({ success: true, message: 'Database reset to demo state', version: database.version });
  });

  // -------------------------------------------------------------
  // REMOTE PC & SECURITY CONTROL API (Controlling PCs across any location)
  // -------------------------------------------------------------

  // 5. Get all remote PC / terminal devices across any location
  app.get('/api/security/devices', (req, res) => {
    try {
      const now = Date.now();
      const list: RemoteDeviceRecord[] = [];

      for (const dev of remoteDevices.values()) {
        const lastPingTime = dev.lastPing ? new Date(dev.lastPing).getTime() : 0;
        const isRecentlyActive = now - lastPingTime < 45000; // 45 seconds timeout

        let computedStatus: RemoteDeviceRecord['status'] = dev.status;
        if (!dev.isAuthorized) {
          computedStatus = 'BLOCKED';
        } else if (dev.isLocked) {
          computedStatus = 'LOCKED';
        } else if (isRecentlyActive) {
          computedStatus = 'ONLINE';
        } else if (now - lastPingTime < 1000 * 60 * 15) {
          computedStatus = 'IDLE';
        } else {
          computedStatus = 'OFFLINE';
        }

        list.push({
          ...dev,
          status: computedStatus,
        });
      }

      // Sort by status (online first) then lastPing
      list.sort((a, b) => {
        if (a.isLocked !== b.isLocked) return a.isLocked ? -1 : 1;
        if (a.status === 'ONLINE' && b.status !== 'ONLINE') return -1;
        if (a.status !== 'ONLINE' && b.status === 'ONLINE') return 1;
        return new Date(b.lastPing).getTime() - new Date(a.lastPing).getTime();
      });

      res.json({
        success: true,
        devices: list,
        totalDevices: list.length,
        onlineCount: list.filter((d) => d.status === 'ONLINE').length,
        lockedCount: list.filter((d) => d.isLocked).length,
        blockedCount: list.filter((d) => !d.isAuthorized).length,
      });
    } catch (err: any) {
      console.error('Failed to get security devices:', err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to get devices' });
    }
  });

  // 6. Remote PC Heartbeat & Registration (Sent by each client every 8-15s)
  app.post('/api/security/heartbeat', (req, res) => {
    try {
      const {
        deviceId,
        deviceName,
        tenantId,
        shopName,
        currentUserId,
        currentUserName,
        currentUserRole,
        browser,
        os,
        deviceType,
        locationCity,
      } = req.body;

      if (!deviceId) {
        return res.status(400).json({ success: false, error: 'deviceId is required' });
      }

      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      const now = new Date().toISOString();
      let device = remoteDevices.get(deviceId);

      if (!device) {
        // Register new device
        device = {
          deviceId,
          deviceName: deviceName || `PC-${deviceId.slice(-6).toUpperCase()}`,
          tenantId: tenantId || 'SHOP001',
          shopName: shopName || 'Retail Branch',
          currentUserId,
          currentUserName,
          currentUserRole,
          ipAddress: clientIp,
          locationCity: locationCity || 'Colombo (Headquarters Link)',
          locationCountry: 'Sri Lanka',
          browser: browser || 'Standard Browser',
          os: os || 'Windows / macOS',
          deviceType: deviceType || 'pos_terminal',
          status: 'ONLINE',
          isAuthorized: true,
          isLocked: false,
          lastPing: now,
          connectedAt: now,
          appVersion: 'v2.8.4 Enterprise',
        };
        remoteDevices.set(deviceId, device);
      } else {
        // Update device heartbeat & details
        device.lastPing = now;
        device.ipAddress = clientIp;
        if (deviceName) device.deviceName = deviceName;
        if (tenantId) device.tenantId = tenantId;
        if (shopName) device.shopName = shopName;
        if (currentUserId !== undefined) device.currentUserId = currentUserId;
        if (currentUserName !== undefined) device.currentUserName = currentUserName;
        if (currentUserRole !== undefined) device.currentUserRole = currentUserRole;
        if (browser) device.browser = browser;
        if (os) device.os = os;
        if (deviceType) device.deviceType = deviceType;
        if (locationCity && !device.locationCity) device.locationCity = locationCity;
      }

      saveDevices(remoteDevices);

      // Return current security status & any pending one-shot command
      const pendingCommand = device.pendingCommand || null;
      const pendingMessage = device.pendingMessage || null;

      // Consume one-shot commands
      if (device.pendingCommand) {
        device.pendingCommand = null;
        device.pendingMessage = undefined;
        saveDevices(remoteDevices);
      }

      res.json({
        success: true,
        deviceId: device.deviceId,
        isLocked: !!device.isLocked,
        lockReason: device.lockReason || 'Remotely locked by System Administrator',
        lockMessage: device.lockMessage || 'Terminal access is temporarily restricted by Headquarters.',
        isAuthorized: device.isAuthorized !== false,
        isBlocked: !device.isAuthorized || device.status === 'BLOCKED',
        pendingCommand,
        pendingMessage,
      });
    } catch (err: any) {
      console.error('Heartbeat error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Heartbeat failed' });
    }
  });

  // 7. Execute Remote Security Action on a PC
  app.post('/api/security/action', (req, res) => {
    try {
      const { deviceId, action, message, reason, newName } = req.body;

      if (!deviceId || !action) {
        return res.status(400).json({ success: false, error: 'deviceId and action are required' });
      }

      const device = remoteDevices.get(deviceId);
      if (!device) {
        return res.status(404).json({ success: false, error: 'Device not found' });
      }

      const defaultMsg = message || 'Security protocol command executed by Headquarters.';
      const defaultReason = reason || 'Headquarters administrative directive';

      switch (action) {
        case 'LOCK':
          device.isLocked = true;
          device.status = 'LOCKED';
          device.lockReason = defaultReason;
          device.lockMessage = defaultMsg;
          device.pendingCommand = 'LOCK';
          device.pendingMessage = defaultMsg;
          broadcastSecurityCommand(deviceId, 'LOCK', {
            reason: defaultReason,
            message: defaultMsg,
          });
          break;

        case 'UNLOCK':
          device.isLocked = false;
          device.status = 'ONLINE';
          device.lockReason = undefined;
          device.lockMessage = undefined;
          device.pendingCommand = 'UNLOCK';
          broadcastSecurityCommand(deviceId, 'UNLOCK');
          break;

        case 'FORCE_LOGOUT':
          device.pendingCommand = 'FORCE_LOGOUT';
          device.pendingMessage = defaultMsg;
          device.currentUserId = undefined;
          device.currentUserName = undefined;
          device.currentUserRole = undefined;
          broadcastSecurityCommand(deviceId, 'FORCE_LOGOUT', { message: defaultMsg });
          break;

        case 'BLOCK':
          device.isAuthorized = false;
          device.status = 'BLOCKED';
          device.pendingCommand = 'BLOCK';
          device.pendingMessage = defaultMsg;
          broadcastSecurityCommand(deviceId, 'BLOCK', { message: defaultMsg });
          break;

        case 'UNBLOCK':
          device.isAuthorized = true;
          device.status = 'ONLINE';
          device.pendingCommand = 'UNBLOCK';
          broadcastSecurityCommand(deviceId, 'UNBLOCK');
          break;

        case 'SEND_MESSAGE':
          device.pendingCommand = 'MESSAGE';
          device.pendingMessage = defaultMsg;
          broadcastSecurityCommand(deviceId, 'MESSAGE', { message: defaultMsg });
          break;

        case 'RENAME':
          if (newName) {
            device.deviceName = newName.trim();
          }
          break;

        case 'DELETE':
          remoteDevices.delete(deviceId);
          saveDevices(remoteDevices);
          return res.json({ success: true, message: 'Device deregistered' });

        default:
          return res.status(400).json({ success: false, error: `Unsupported action: ${action}` });
      }

      saveDevices(remoteDevices);

      res.json({
        success: true,
        device,
        actionExecuted: action,
      });
    } catch (err: any) {
      console.error('Remote security action error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to execute security action' });
    }
  });

  // 8. Bulk Security Lockdown / Unlock for an entire Shop
  app.post('/api/security/shop-lockdown', (req, res) => {
    try {
      const { tenantId, action, message, reason } = req.body;
      if (!tenantId || !action) {
        return res.status(400).json({ success: false, error: 'tenantId and action are required' });
      }

      let affectedCount = 0;
      const defaultMsg = message || (action === 'LOCK_ALL' ? 'Emergency lockdown initiated by Super Admin' : 'Shop lockdown lifted');
      const defaultReason = reason || 'Headquarters emergency protocol';

      for (const dev of remoteDevices.values()) {
        if (dev.tenantId === tenantId) {
          if (action === 'LOCK_ALL') {
            dev.isLocked = true;
            dev.status = 'LOCKED';
            dev.lockReason = defaultReason;
            dev.lockMessage = defaultMsg;
            dev.pendingCommand = 'LOCK';
            dev.pendingMessage = defaultMsg;
            broadcastSecurityCommand(dev.deviceId, 'LOCK', { reason: defaultReason, message: defaultMsg });
            affectedCount++;
          } else if (action === 'UNLOCK_ALL') {
            dev.isLocked = false;
            dev.status = 'ONLINE';
            dev.lockReason = undefined;
            dev.lockMessage = undefined;
            dev.pendingCommand = 'UNLOCK';
            broadcastSecurityCommand(dev.deviceId, 'UNLOCK');
            affectedCount++;
          } else if (action === 'LOGOUT_ALL') {
            dev.pendingCommand = 'FORCE_LOGOUT';
            dev.pendingMessage = defaultMsg;
            dev.currentUserId = undefined;
            broadcastSecurityCommand(dev.deviceId, 'FORCE_LOGOUT', { message: defaultMsg });
            affectedCount++;
          }
        }
      }

      saveDevices(remoteDevices);

      res.json({
        success: true,
        tenantId,
        action,
        affectedCount,
      });
    } catch (err: any) {
      console.error('Shop lockdown error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Failed to execute shop action' });
    }
  });

  // 9. Override Remote Lock locally with Admin Password / PIN
  app.post('/api/security/unlock-override', (req, res) => {
    try {
      const { deviceId, pinOrPassword } = req.body;
      if (!deviceId) {
        return res.status(400).json({ success: false, error: 'deviceId is required' });
      }

      // Allow master admin password or pin
      const isValid = pinOrPassword === 'admin123' || pinOrPassword === '9999' || pinOrPassword === 'superadmin';
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid Headquarters Security Override PIN/Password' });
      }

      const device = remoteDevices.get(deviceId);
      if (device) {
        device.isLocked = false;
        device.status = 'ONLINE';
        device.lockReason = undefined;
        device.lockMessage = undefined;
        saveDevices(remoteDevices);
      }

      broadcastSecurityCommand(deviceId, 'UNLOCK');

      res.json({ success: true, message: 'Terminal unlocked via security override' });
    } catch (err: any) {
      console.error('Unlock override error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Override failed' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`WCS Retail Cloud Sync Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal: Failed to start server:', err);
});
