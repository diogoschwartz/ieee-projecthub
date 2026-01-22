
export interface IcsEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  isExternal: boolean;
  chapter?: { 
    cor: string; 
    sigla: string;
    nome?: string;
  };
}

// Helper to parse ICS date string
const parseIcsDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString();
  
  // Remove TZID if present (simplification)
  const cleanStr = dateStr.replace('Z', '').trim();
  
  const year = cleanStr.substring(0, 4);
  const month = cleanStr.substring(4, 6);
  const day = cleanStr.substring(6, 8);
  
  // All day event (YYYYMMDD)
  if (cleanStr.length <= 8) {
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  const hour = cleanStr.substring(9, 11);
  const minute = cleanStr.substring(11, 13);
  const second = cleanStr.substring(13, 15);

  // Return ISO string
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
};

// Helper to unescape ICS text
const unescapeIcsText = (str: string) => {
  if (!str) return '';
  return str.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/g, '\n').replace(/\\N/g, '\n').replace(/\\\\/g, '\\');
};

export const fetchIcsEvents = async (url: string, onLog?: (msg: string) => void): Promise<IcsEvent[]> => {
  try {
    if (onLog) onLog(`[Service] Iniciando processo para URL: ${url.substring(0, 30)}...`);
    
    // Using allorigins as CORS proxy
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    if (onLog) onLog(`[Service] Conectando via Proxy: ${proxyUrl}`);

    const response = await fetch(proxyUrl);
    
    if (onLog) onLog(`[Service] Resposta HTTP recebida: ${response.status} ${response.statusText}`);

    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.contents) {
        if (onLog) onLog(`[Service] ERRO: Proxy retornou conteúdo vazio ou inválido.`);
        return [];
    }

    let icsData = data.contents;
    
    // Debug: Log start of content to diagnose format
    if (onLog) onLog(`[Service] Raw Content Start: ${icsData.substring(0, 100).replace(/\n/g, '\\n')}`);

    // Handle Data URI (Base64) - Proxies sometimes return this format
    if (icsData.startsWith('data:')) {
        if (onLog) onLog('[Service] Data URI detectado. Decodificando Base64...');
        try {
            const base64Part = icsData.split(',')[1];
            if (base64Part) {
                const binString = atob(base64Part);
                // Decode UTF-8 manually to avoid issues
                const bytes = new Uint8Array(binString.length);
                for (let i = 0; i < binString.length; i++) {
                    bytes[i] = binString.charCodeAt(i);
                }
                icsData = new TextDecoder().decode(bytes);
                if (onLog) onLog(`[Service] Decodificação concluída. Novo tamanho: ${icsData.length}`);
            }
        } catch (e) {
            if (onLog) onLog(`[Service] Falha ao decodificar Base64: ${e}`);
        }
    }

    const events: IcsEvent[] = [];
    
    // Try standard split
    let lines = icsData.split(/\r\n|\n|\r/);
    
    // If single line, try robust literal unescaping (JSON encoded string)
    if (lines.length <= 1) {
        if (onLog) onLog(`[Service] Aviso: Arquivo linha única. Tentando unescape de literais...`);
        // Replace literal \r\n, \n, \r with real newline character
        const unescaped = icsData
            .replace(/\\r\\n/g, '\n')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\n');
        lines = unescaped.split('\n');
    }
    
    if (onLog) onLog(`[Service] Iniciando parse de ${lines.length} linhas...`);

    let inEvent = false;
    let currentEvent: any = {};
    let parsedCount = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Handle multi-line values (folding: lines starting with space/tab)
      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        line += lines[i + 1].substring(1);
        i++;
      }

      // Trim line for checking BEGIN/END tags only
      const trimmedLine = line.trim();

      if (trimmedLine === 'BEGIN:VEVENT') {
        inEvent = true;
        currentEvent = { };
      } else if (trimmedLine === 'END:VEVENT') {
        inEvent = false;
        if (currentEvent.SUMMARY && currentEvent.DTSTART) {
            try {
                const startDateStr = parseIcsDate(currentEvent.DTSTART);
                let endDateStr = currentEvent.DTEND ? parseIcsDate(currentEvent.DTEND) : startDateStr;
                
                // Fix potential date inversion (common in some ICS files)
                if (new Date(endDateStr) <= new Date(startDateStr)) {
                    const d = new Date(startDateStr);
                    d.setHours(d.getHours() + 1);
                    endDateStr = d.toISOString();
                }

                events.push({
                    id: `ext-${currentEvent.UID || Math.random().toString(36).substr(2, 9)}`,
                    title: unescapeIcsText(currentEvent.SUMMARY),
                    startDate: startDateStr,
                    endDate: endDateStr,
                    location: unescapeIcsText(currentEvent.LOCATION || ''),
                    description: unescapeIcsText(currentEvent.DESCRIPTION || ''),
                    isExternal: true,
                    chapter: { 
                        cor: 'from-emerald-600 to-green-700', 
                        sigla: 'GCal',
                        nome: 'Google Calendar'
                    }
                });
                parsedCount++;
            } catch (err) {
                // Ignore malformed event dates
            }
        }
      } else if (inEvent) {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex === -1) continue;

        const keyPart = line.substring(0, separatorIndex);
        const value = line.substring(separatorIndex + 1);
        
        const [keyName] = keyPart.split(';');

        if (keyName === 'SUMMARY') currentEvent.SUMMARY = value;
        else if (keyName === 'DTSTART') currentEvent.DTSTART = value;
        else if (keyName === 'DTEND') currentEvent.DTEND = value;
        else if (keyName === 'LOCATION') currentEvent.LOCATION = value;
        else if (keyName === 'DESCRIPTION') currentEvent.DESCRIPTION = value;
        else if (keyName === 'UID') currentEvent.UID = value;
      }
    }

    if (onLog) onLog(`[Service] Parse concluído. ${parsedCount} eventos encontrados.`);
    return events;
  } catch (error: any) {
    if (onLog) onLog(`[Service] ERRO CRÍTICO: ${error.message}`);
    console.error("Error fetching ICS:", error);
    return [];
  }
};
