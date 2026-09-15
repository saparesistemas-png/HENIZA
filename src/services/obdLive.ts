/**
 * Leitura OBD-II em tempo real via adaptador ELM327.
 * - Web Bluetooth (BLE) no Chrome/Android
 * - Simulador para demo sem hardware
 *
 * Protocolo: comandos AT + Mode 01 PIDs (ISO 15031 / SAE J1979).
 */

export type PidId =
  | 'rpm'
  | 'speed'
  | 'coolant'
  | 'iat'
  | 'throttle'
  | 'load'
  | 'maf'
  | 'fuelPressure'
  | 'stft_b1'
  | 'ltft_b1'
  | 'voltage'
  | 'timing'
  | 'oilTemp'
  | 'fuelLevel';

export type PidDefinition = {
  id: PidId;
  mode: number;
  pid: number;
  name: string;
  unit: string;
  bytes: number;
  decode: (data: number[]) => number | null;
  min?: number;
  max?: number;
  group: 'motor' | 'temp' | 'combustivel' | 'eletrica';
};

export type PidSample = {
  id: PidId;
  name: string;
  value: number | null;
  unit: string;
  rawHex?: string;
  at: number;
  ok: boolean;
  error?: string;
};

export type ObdConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'ready'
  | 'polling'
  | 'error'
  | 'simulated';

export type ObdLiveSnapshot = {
  state: ObdConnectionState;
  deviceName?: string;
  protocol?: string;
  samples: Partial<Record<PidId, PidSample>>;
  lastError?: string;
  dtcCount?: number;
};

/** PIDs Mode 01 mais usados em oficina. */
export const PID_DEFS: PidDefinition[] = [
  {
    id: 'rpm',
    mode: 0x01,
    pid: 0x0c,
    name: 'Rotação (RPM)',
    unit: 'rpm',
    bytes: 2,
    group: 'motor',
    min: 0,
    max: 8000,
    decode: (d) => (d.length >= 2 ? (d[0] * 256 + d[1]) / 4 : null),
  },
  {
    id: 'speed',
    mode: 0x01,
    pid: 0x0d,
    name: 'Velocidade',
    unit: 'km/h',
    bytes: 1,
    group: 'motor',
    min: 0,
    max: 250,
    decode: (d) => (d.length >= 1 ? d[0] : null),
  },
  {
    id: 'coolant',
    mode: 0x01,
    pid: 0x05,
    name: 'Temp. arrefecimento (ECT)',
    unit: '°C',
    bytes: 1,
    group: 'temp',
    min: -40,
    max: 150,
    decode: (d) => (d.length >= 1 ? d[0] - 40 : null),
  },
  {
    id: 'iat',
    mode: 0x01,
    pid: 0x0f,
    name: 'Temp. ar admissão (IAT)',
    unit: '°C',
    bytes: 1,
    group: 'temp',
    min: -40,
    max: 120,
    decode: (d) => (d.length >= 1 ? d[0] - 40 : null),
  },
  {
    id: 'oilTemp',
    mode: 0x01,
    pid: 0x5c,
    name: 'Temp. óleo motor',
    unit: '°C',
    bytes: 1,
    group: 'temp',
    min: -40,
    max: 160,
    decode: (d) => (d.length >= 1 ? d[0] - 40 : null),
  },
  {
    id: 'throttle',
    mode: 0x01,
    pid: 0x11,
    name: 'Posição borboleta',
    unit: '%',
    bytes: 1,
    group: 'motor',
    min: 0,
    max: 100,
    decode: (d) => (d.length >= 1 ? (d[0] * 100) / 255 : null),
  },
  {
    id: 'load',
    mode: 0x01,
    pid: 0x04,
    name: 'Carga calculada',
    unit: '%',
    bytes: 1,
    group: 'motor',
    min: 0,
    max: 100,
    decode: (d) => (d.length >= 1 ? (d[0] * 100) / 255 : null),
  },
  {
    id: 'maf',
    mode: 0x01,
    pid: 0x10,
    name: 'Fluxo de ar (MAF)',
    unit: 'g/s',
    bytes: 2,
    group: 'combustivel',
    min: 0,
    max: 100,
    decode: (d) => (d.length >= 2 ? (d[0] * 256 + d[1]) / 100 : null),
  },
  {
    id: 'stft_b1',
    mode: 0x01,
    pid: 0x06,
    name: 'STFT banco 1',
    unit: '%',
    bytes: 1,
    group: 'combustivel',
    min: -100,
    max: 100,
    decode: (d) => (d.length >= 1 ? d[0] / 1.28 - 100 : null),
  },
  {
    id: 'ltft_b1',
    mode: 0x01,
    pid: 0x07,
    name: 'LTFT banco 1',
    unit: '%',
    bytes: 1,
    group: 'combustivel',
    min: -100,
    max: 100,
    decode: (d) => (d.length >= 1 ? d[0] / 1.28 - 100 : null),
  },
  {
    id: 'voltage',
    mode: 0x01,
    pid: 0x42,
    name: 'Tensão módulo',
    unit: 'V',
    bytes: 2,
    group: 'eletrica',
    min: 0,
    max: 20,
    decode: (d) => (d.length >= 2 ? (d[0] * 256 + d[1]) / 1000 : null),
  },
  {
    id: 'timing',
    mode: 0x01,
    pid: 0x0e,
    name: 'Avanço de ignição',
    unit: '°',
    bytes: 1,
    group: 'motor',
    min: -64,
    max: 64,
    decode: (d) => (d.length >= 1 ? d[0] / 2 - 64 : null),
  },
  {
    id: 'fuelLevel',
    mode: 0x01,
    pid: 0x2f,
    name: 'Nível de combustível',
    unit: '%',
    bytes: 1,
    group: 'combustivel',
    min: 0,
    max: 100,
    decode: (d) => (d.length >= 1 ? (d[0] * 100) / 255 : null),
  },
  {
    id: 'fuelPressure',
    mode: 0x01,
    pid: 0x0a,
    name: 'Pressão combustível',
    unit: 'kPa',
    bytes: 1,
    group: 'combustivel',
    min: 0,
    max: 800,
    decode: (d) => (d.length >= 1 ? d[0] * 3 : null),
  },
];

export const DEFAULT_POLL_PIDS: PidId[] = [
  'rpm',
  'speed',
  'coolant',
  'iat',
  'throttle',
  'load',
  'voltage',
  'stft_b1',
];

const BLE_UART_CANDIDATES: Array<{ service: string; rx: string; tx: string }> = [
  // Nordic UART
  {
    service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    tx: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
    rx: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
  },
  // Common ELM327 BLE clones
  {
    service: '0000fff0-0000-1000-8000-00805f9b34fb',
    tx: '0000fff2-0000-1000-8000-00805f9b34fb',
    rx: '0000fff1-0000-1000-8000-00805f9b34fb',
  },
  {
    service: '0000ffe0-0000-1000-8000-00805f9b34fb',
    tx: '0000ffe1-0000-1000-8000-00805f9b34fb',
    rx: '0000ffe1-0000-1000-8000-00805f9b34fb',
  },
];

function toHex2(n: number) {
  return n.toString(16).toUpperCase().padStart(2, '0');
}

function buildPidCommand(mode: number, pid: number) {
  return `${toHex2(mode)}${toHex2(pid)}\r`;
}

/** Parse resposta ELM tipo "41 0C 1A F8" */
export function parseElmPidResponse(
  response: string,
  mode: number,
  pid: number,
  expectedBytes: number
): { data: number[]; rawHex: string } | null {
  const cleaned = response
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/SEARCHING\.\.\./gi, ' ')
    .replace(/>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  if (!cleaned || /NO DATA|UNABLE|ERROR|BUSY|\?/.test(cleaned)) return null;

  const expectHeader = `${toHex2(mode + 0x40)} ${toHex2(pid)}`;
  const expectCompact = `${toHex2(mode + 0x40)}${toHex2(pid)}`;

  // Prefer line that contains the positive response header
  const parts = cleaned.split(' ').filter(Boolean);
  const hexBytes: string[] = [];
  for (const p of parts) {
    if (/^[0-9A-F]{2}$/.test(p)) hexBytes.push(p);
  }

  // Find header index
  let start = -1;
  for (let i = 0; i < hexBytes.length - 1; i++) {
    if (
      hexBytes[i] === toHex2(mode + 0x40) &&
      hexBytes[i + 1] === toHex2(pid)
    ) {
      start = i + 2;
      break;
    }
  }

  if (start < 0) {
    // compact form without spaces already split wrong — try regex
    const m = cleaned.replace(/ /g, '').match(
      new RegExp(`${toHex2(mode + 0x40)}${toHex2(pid)}([0-9A-F]+)`)
    );
    if (!m) return null;
    const dataHex = m[1].match(/.{2}/g) || [];
    const data = dataHex.slice(0, expectedBytes).map((h) => parseInt(h, 16));
    if (data.length < expectedBytes) return null;
    return { data, rawHex: expectCompact + dataHex.slice(0, expectedBytes).join('') };
  }

  const data = hexBytes.slice(start, start + expectedBytes).map((h) => parseInt(h, 16));
  if (data.some((n) => Number.isNaN(n)) || data.length < expectedBytes) return null;
  return {
    data,
    rawHex: `${expectHeader} ${hexBytes.slice(start, start + expectedBytes).join(' ')}`,
  };
}

export function isWebBluetoothAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!(navigator as any).bluetooth;
}

type Listener = (snap: ObdLiveSnapshot) => void;

export class ObdLiveSession {
  private state: ObdConnectionState = 'disconnected';
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private rxChar: BluetoothRemoteGATTCharacteristic | null = null;
  private txChar: BluetoothRemoteGATTCharacteristic | null = null;
  private buffer = '';
  private samples: Partial<Record<PidId, PidSample>> = {};
  private listeners = new Set<Listener>();
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private pollPids: PidId[] = [...DEFAULT_POLL_PIDS];
  private lastError?: string;
  private deviceName?: string;
  private protocol?: string;
  private commandQueue: Promise<void> = Promise.resolve();
  private simTimer: ReturnType<typeof setInterval> | null = null;
  private pendingResolve: ((text: string) => void) | null = null;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const snap = this.snapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  snapshot(): ObdLiveSnapshot {
    return {
      state: this.state,
      deviceName: this.deviceName,
      protocol: this.protocol,
      samples: { ...this.samples },
      lastError: this.lastError,
    };
  }

  setPollPids(ids: PidId[]) {
    this.pollPids = ids.length ? ids : [...DEFAULT_POLL_PIDS];
  }

  async connectBluetooth(): Promise<void> {
    if (!isWebBluetoothAvailable()) {
      throw new Error(
        'Web Bluetooth indisponível. Use Chrome no Android/desktop ou o modo simulador.'
      );
    }

    this.state = 'connecting';
    this.lastError = undefined;
    this.emit();

    try {
      const optionalServices = BLE_UART_CANDIDATES.map((c) => c.service);
      const device: BluetoothDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices,
      });

      this.device = device;
      this.deviceName = device.name || 'ELM327';
      device.addEventListener('gattserverdisconnected', () => {
        this.cleanupConnection('disconnected');
      });

      const server = await device.gatt!.connect();
      this.server = server;

      let linked = false;
      for (const cand of BLE_UART_CANDIDATES) {
        try {
          const service = await server.getPrimaryService(cand.service);
          const tx = await service.getCharacteristic(cand.tx);
          const rx =
            cand.rx === cand.tx ? tx : await service.getCharacteristic(cand.rx);
          this.txChar = tx;
          this.rxChar = rx;
          await rx.startNotifications();
          rx.addEventListener('characteristicvaluechanged', this.onNotify);
          linked = true;
          break;
        } catch {
          /* tenta próximo UUID */
        }
      }

      if (!linked) {
        throw new Error(
          'Adaptador encontrado, mas serviço UART BLE não reconhecido. Preferir ELM327 BLE (não o clássico SPP).'
        );
      }

      await this.initElm();
      this.state = 'ready';
      this.emit();
    } catch (err: any) {
      this.lastError = err?.message || String(err);
      this.state = 'error';
      this.emit();
      throw err;
    }
  }

  /** Modo demo sem hardware — gera valores realistas. */
  startSimulator() {
    this.stopPolling();
    this.cleanupConnection('simulated');
    this.state = 'simulated';
    this.deviceName = 'Simulador OBD';
    this.protocol = 'SIM';
    this.lastError = undefined;
    this.emit();

    let t = 0;
    this.simTimer = setInterval(() => {
      t += 1;
      const rpm = 800 + Math.round(200 * Math.sin(t / 8) + 150 * Math.random());
      const cool = 85 + Math.round(3 * Math.sin(t / 20));
      const iat = 28 + Math.round(2 * Math.sin(t / 15));
      const now = Date.now();
      const put = (id: PidId, value: number) => {
        const def = PID_DEFS.find((p) => p.id === id)!;
        this.samples[id] = {
          id,
          name: def.name,
          value: Math.round(value * 10) / 10,
          unit: def.unit,
          at: now,
          ok: true,
        };
      };
      put('rpm', rpm);
      put('speed', Math.max(0, Math.round((rpm - 800) / 40)));
      put('coolant', cool);
      put('iat', iat);
      put('throttle', 12 + 5 * Math.sin(t / 6));
      put('load', 18 + 8 * Math.sin(t / 10));
      put('voltage', 13.8 + 0.2 * Math.sin(t / 12));
      put('stft_b1', -2 + 3 * Math.sin(t / 9));
      put('ltft_b1', 1.5);
      this.state = 'polling';
      this.emit();
    }, 800);
  }

  private onNotify = (ev: Event) => {
    const char = ev.target as BluetoothRemoteGATTCharacteristic;
    const value = char.value;
    if (!value) return;
    const dec = new TextDecoder('utf-8');
    this.buffer += dec.decode(value.buffer);
    if (this.buffer.includes('>') && this.pendingResolve) {
      const full = this.buffer;
      this.buffer = '';
      const resolve = this.pendingResolve;
      this.pendingResolve = null;
      resolve(full);
    }
  };

  private async writeRaw(cmd: string) {
    if (!this.txChar) throw new Error('Sem característica TX');
    const data = new TextEncoder().encode(cmd.endsWith('\r') ? cmd : cmd + '\r');
    if (this.txChar.properties.writeWithoutResponse) {
      await this.txChar.writeValueWithoutResponse(data);
    } else {
      await this.txChar.writeValue(data);
    }
  }

  private sendCommand(cmd: string, timeoutMs = 3000): Promise<string> {
    this.commandQueue = this.commandQueue.then(async () => {
      /* sequential */
    });
    return new Promise<string>((resolve, reject) => {
      this.commandQueue = this.commandQueue.then(async () => {
        this.buffer = '';
        const timer = setTimeout(() => {
          if (this.pendingResolve) {
            this.pendingResolve = null;
            reject(new Error('Timeout OBD: ' + cmd.trim()));
          }
        }, timeoutMs);

        this.pendingResolve = (text) => {
          clearTimeout(timer);
          resolve(text);
        };

        try {
          await this.writeRaw(cmd);
        } catch (err) {
          clearTimeout(timer);
          this.pendingResolve = null;
          reject(err);
        }
      });
    });
  }

  private async initElm() {
    const cmds = ['ATZ', 'ATE0', 'ATL0', 'ATS0', 'ATH0', 'ATSP0'];
    for (const c of cmds) {
      try {
        const r = await this.sendCommand(c, 4000);
        if (c === 'ATZ') this.protocol = r.replace(/[\r\n>]/g, ' ').trim().slice(0, 40);
      } catch {
        /* alguns clones falham em comandos isolados */
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  async readPid(id: PidId): Promise<PidSample> {
    const def = PID_DEFS.find((p) => p.id === id);
    if (!def) {
      return {
        id,
        name: id,
        value: null,
        unit: '',
        at: Date.now(),
        ok: false,
        error: 'PID desconhecido',
      };
    }

    if (this.state === 'simulated' || this.state === 'polling' && this.simTimer) {
      return (
        this.samples[id] || {
          id,
          name: def.name,
          value: null,
          unit: def.unit,
          at: Date.now(),
          ok: false,
          error: 'Sem amostra',
        }
      );
    }

    const cmd = buildPidCommand(def.mode, def.pid);
    try {
      const resp = await this.sendCommand(cmd, 3500);
      const parsed = parseElmPidResponse(resp, def.mode, def.pid, def.bytes);
      if (!parsed) {
        const sample: PidSample = {
          id,
          name: def.name,
          value: null,
          unit: def.unit,
          rawHex: resp.slice(0, 80),
          at: Date.now(),
          ok: false,
          error: 'Sem dados',
        };
        this.samples[id] = sample;
        this.emit();
        return sample;
      }
      const value = def.decode(parsed.data);
      const sample: PidSample = {
        id,
        name: def.name,
        value: value == null ? null : Math.round(value * 100) / 100,
        unit: def.unit,
        rawHex: parsed.rawHex,
        at: Date.now(),
        ok: value != null,
      };
      this.samples[id] = sample;
      this.emit();
      return sample;
    } catch (err: any) {
      const sample: PidSample = {
        id,
        name: def.name,
        value: null,
        unit: def.unit,
        at: Date.now(),
        ok: false,
        error: err?.message || String(err),
      };
      this.samples[id] = sample;
      this.lastError = sample.error;
      this.emit();
      return sample;
    }
  }

  startPolling(intervalMs = 1000) {
    this.stopPolling(false);
    if (this.state !== 'ready' && this.state !== 'polling' && this.state !== 'simulated') {
      throw new Error('Conecte o adaptador ou inicie o simulador antes.');
    }
    if (this.simTimer) {
      // simulador já emite sozinho
      this.state = 'polling';
      this.emit();
      return;
    }
    this.state = 'polling';
    this.emit();
    const tick = async () => {
      for (const id of this.pollPids) {
        if (this.state !== 'polling') break;
        await this.readPid(id);
      }
    };
    void tick();
    this.pollTimer = setInterval(() => void tick(), intervalMs);
  }

  stopPolling(emit = true) {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
    if (this.state === 'polling') this.state = this.device ? 'ready' : 'disconnected';
    if (emit) this.emit();
  }

  /** Monta texto de sintomas a partir do live data (para o diagnóstico IA). */
  buildSymptomHint(): string {
    const s = this.samples;
    const bits: string[] = ['Leitura OBD ao vivo:'];
    const cool = s.coolant?.value;
    const iat = s.iat?.value;
    const rpm = s.rpm?.value;
    const stft = s.stft_b1?.value;
    if (cool != null) {
      bits.push(`ECT ${cool}°C`);
      if (cool > 110) bits.push('superaquecimento');
      if (cool < 70 && rpm && rpm > 500) bits.push('motor frio / termostato');
    }
    if (iat != null) bits.push(`IAT ${iat}°C`);
    if (rpm != null) bits.push(`RPM ${rpm}`);
    if (stft != null && Math.abs(stft) > 15) bits.push(`STFT fora de faixa (${stft}%)`);
    if (s.voltage?.value != null && s.voltage.value < 12.2) bits.push('tensão baixa');
    return bits.join(' · ');
  }

  disconnect() {
    this.stopPolling(false);
    try {
      this.device?.gatt?.disconnect();
    } catch {
      /* ignore */
    }
    this.cleanupConnection('disconnected');
  }

  private cleanupConnection(state: ObdConnectionState) {
    try {
      this.rxChar?.removeEventListener('characteristicvaluechanged', this.onNotify);
    } catch {
      /* ignore */
    }
    this.rxChar = null;
    this.txChar = null;
    this.server = null;
    this.device = null;
    this.pendingResolve = null;
    this.buffer = '';
    this.state = state;
    if (state === 'disconnected') {
      this.deviceName = undefined;
      this.protocol = undefined;
    }
    this.emit();
  }
}

/** Singleton de sessão para o OficIA. */
let shared: ObdLiveSession | null = null;
export function getObdLiveSession() {
  if (!shared) shared = new ObdLiveSession();
  return shared;
}
