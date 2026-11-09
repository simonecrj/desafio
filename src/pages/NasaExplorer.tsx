import { useState } from 'react';
import { CloudSun, Download, Search } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api';
type Row = {
    date: string;
    T2M?: number | null;
    T2M_MAX?: number | null;
    T2M_MIN?: number | null;
    T2M_RANGE?: number | null;
    TS?: number | null;
    T2MDEW?: number | null; 
    T2MWET?: number | null; 
    PRECTOTCORR?: number | null; 
    RH2M?: number | null; 
    QV2M?: number | null; 
    PS?: number | null; 
    WS2M?: number | null; 
    WS10M?: number | null; 
    WD2M?: number | null; 
    WD10M?: number | null; 
    ALLSKY_SFC_SW_DWN?: number | null; 
    CLRSKY_SFC_SW_DWN?: number | null; 
    ALLSKY_KT?: number | null; 
    ALLSKY_SFC_PAR_TOT?: number | null; 
    GWETTOP?: number | null; 
    GWETROOT?: number | null
};
export default function NasaExplorer() {
    const [lat, setLat] = useState('-22.9068'); 
    const [lon, setLon] = useState('-43.1729'); 
    const [start, setStart] = useState('20240101'); 
    const [end, setEnd] = useState('20240115'); 
    const [parameter, setParameter] = useState('T2M'); 
    const [rows, setRows] = useState<Row[]>([]); 
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState(''); 
    const [queried, setQueried] = useState(false);
    async function search() { 
        setLoading(true); 
        setError(''); 
        setQueried(true); 
        try { 
            const r = await api.get('/nasa/power', 
            { params: { 
                latitude: lat, 
                longitude: lon, 
                start, 
                end, 
                parameters: parameter, 
                community: 'AG' 
            } 
        }); 
        setRows(r.data.data || []); 
        if (!(r.data.data || []).length) 
        setError('A NASA POWER não retornou pontos para esses filtros.') 
    } catch (e: any) { 
        setRows([]); 
        setError(e?.response?.data?.message || 'Falha ao consultar NASA POWER. Confirme se o backend está ativo e tente outro período.') } finally { setLoading(false) } }
    function csv() { 
        const content = [['data', parameter], 
    ...rows.map(r => [r.date, r[parameter as keyof Row] ?? ''])].map(r => r.join(',')).join('\n'); 
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(new Blob(['\ufeff' + content], 
    { 
        type: 'text/csv;charset=utf-8' 
    }
    )); 
    a.download = `nasa-power-${parameter.toLowerCase()}.csv`; 
    a.click(); 
    URL.revokeObjectURL(a.href) 
}
    const labels: Record<string, string> = { 
    T2M: 'Temperatura média do ar (°C)', 
    T2M_MAX: 'Temperatura máxima do ar (°C)', 
    T2M_MIN: 'Temperatura mínima do ar (°C)', 
    T2M_RANGE: 'Amplitude diária da temperatura do ar (°C)', 
    TS: 'Temperatura da superfície do modelo — não é LST de satélite (°C)', 
    T2MDEW: 'Temperatura do ponto de orvalho (°C)', 
    T2MWET: 'Temperatura de bulbo úmido (°C)', 
    QV2M: 'Umidade específica (g/kg)', 
    PS: 'Pressão na superfície (kPa)', 
    WS10M: 'Velocidade do vento a 10 m (m/s)', 
    WD2M: 'Direção do vento a 2 m (graus)', 
    WD10M: 'Direção do vento a 10 m (graus)', 
    ALLSKY_SFC_SW_DWN: 'Radiação solar na superfície (kWh/m²/dia)', 
    CLRSKY_SFC_SW_DWN: 'Radiação solar céu claro (kWh/m²/dia)', 
    ALLSKY_KT: 'Índice de claridade', 
    ALLSKY_SFC_PAR_TOT: 'Radiação fotossinteticamente ativa (W/m²)', 
    GWETTOP: 'Umidade do solo superficial (fração)', 
    GWETROOT: 'Umidade do solo na zona radicular (fração)', 
    PRECTOTCORR: 'Precipitação corrigida (mm/dia)', 
    RH2M: 'Umidade relativa a 2 m (%)', 
    WS2M: 'Velocidade do vento a 2 m (m/s)' 
};
    return <div className="page-content">
        <div className="page-heading">
            <div>
                <div className="eyebrow">INTEGRAÇÃO COM FONTE OFICIAL</div>
                <h1>Explorador NASA POWER</h1>
                <p>Consulte séries diárias para coordenadas e período selecionados.</p>
                </div>
                <span className="unit-pill">API NASA</span>
                </div>
                <div className="demo-banner"><CloudSun size={18} /><div>
                    <strong>Consulta direta à fonte oficial NASA POWER</strong>
                    <p>A resposta vem da API NASA POWER; 
                        valores ausentes podem ser marcados pela fonte. Temperatura do ar não é o mesmo que temperatura da superfície terrestre (LST).</p>
                        </div></div>
                        <section className="filters-card">
                            <div className="filter-title"><Search size={17} />
                            <strong>Parâmetros da consulta</strong>
                            </div><div className="filters-grid nasa-filters">
                                <div className="field">
                                    <label htmlFor="lat">Latitude</label>
                                    <input id="lat" type="number" step="any" value={lat} onChange={e => setLat(e.target.value)
                                    } />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="lon">Longitude</label>
                                        <input id="lon" type="number" step="any" value={lon} onChange={e => setLon(e.target.value)} />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="start">Início (AAAAMMDD)</label>
                                        <input id="start" pattern="[0-9]{8}" value={start} onChange={e => setStart(e.target.value)} />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="end">Fim (AAAAMMDD)</label>
                                        <input id="end" pattern="[0-9]{8}" value={end} onChange={e => setEnd(e.target.value)} />
                                    </div>
                                    <div className="field">
                                        <label htmlFor="param">Variável</label>
                                        <select id="param" value={parameter} onChange={e => setParameter(e.target.value)}>{Object.entries(labels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div><button className="primary-button" disabled={loading} onClick={() => void search()}>{loading ? 'Consultando…' : 'Consultar NASA'}</button></div></section>{error && <div className="error-banner">{error}</div>}{queried && rows.length > 0 && <><div className="stats-grid"><article className="stat-card"><div className="stat-top">Pontos retornados</div><strong className="stat-value">{rows.length}</strong><span className="stat-note">Observações diárias na resposta</span></article><article className="stat-card"><div className="stat-top">Média no período
                                    </div>
                                    <strong className="stat-value">{(rows.map(r => r[parameter as keyof Row]).filter((v): v is number => typeof v === 'number').reduce((a, b) => a + b, 0) / Math.max(1, rows.map(r => r[parameter as keyof Row]).filter((v): v is number => typeof v === 'number').length)).toFixed(2)}</strong>
                                    <span className="stat-note">{labels[parameter]}</span>
                                    </article>
                                    </div>
                                    <section className="panel"><div className="panel-heading">
                                        <div>
                                            <h2>{labels[parameter]}</h2>
                                            <p>Coordenadas {lat}, {lon} · NASA POWER Daily API</p>
                                        </div>
                                        <button className="secondary-button" onClick={csv}>
                                            <Download size={16} /> Exportar CSV</button>
                                            </div>
                                            <div className="chart-wrap">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={rows} margin={{ top: 10, right: 18, left: 0, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                                        <YAxis tick={{ fontSize: 11 }} />
                                                        <Tooltip />
                                                        <Line type="monotone" dataKey={parameter} name={labels[parameter]} stroke="#177c67" connectNulls={false} dot={false} strokeWidth={2} /></LineChart></ResponsiveContainer></div><p className="chart-footnote">Fonte: NASA POWER, Daily Point API. Confira a documentação e as limitações dos dados antes de utilizá-los em conclusões científicas.</p></section><section className="panel"><div className="panel-heading">
                                                            <div>
                                                                <h2>Dados retornados</h2>
                                                                <p>Valores diários enviados pela API.</p>
                                                            </div>
                                                            </div>
                                                            <div className="table-scroll">
                                                                <table className="data-table">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Data</th>
                                                                            <th>{parameter}</th>
                                                                            </tr></thead><tbody>{rows.map(r => <tr key={r.date}><td>{r.date}
                                                                            </td>
                                                                            <td>{r[parameter as keyof Row] ?? 'Sem dado'}</td>
                                                                            </tr>)}</tbody></table></div></section></>}
                                                            </div>
}
