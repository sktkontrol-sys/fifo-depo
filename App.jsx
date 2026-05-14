import { useState, useEffect, useCallback } from "react";

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INITIAL_URUNLER = [
  { id: "U001", kod: "SKU-1001", ad: "Domates Konservesi 400g", rafOmru: 730 },
  { id: "U002", kod: "SKU-1002", ad: "Zeytinyağı 1L", rafOmru: 540 },
  { id: "U003", kod: "SKU-1003", ad: "Un 5kg", rafOmru: 365 },
  { id: "U004", kod: "SKU-1004", ad: "Şeker 2kg", rafOmru: 1095 },
  { id: "U005", kod: "SKU-1005", ad: "Makarna 500g", rafOmru: 730 },
];

const INITIAL_LOKASYONLAR = [
  { id: "L001", kod: "A-01-01", urunId: "U001" },
  { id: "L002", kod: "A-01-02", urunId: "U002" },
  { id: "L003", kod: "A-02-01", urunId: "U003" },
  { id: "L004", kod: "B-01-01", urunId: "U004" },
  { id: "L005", kod: "B-01-02", urunId: "U005" },
  { id: "L006", kod: "B-02-01", urunId: "U001" },
  { id: "L007", kod: "C-01-01", urunId: "U003" },
  { id: "L008", kod: "C-02-01", urunId: "U002" },
];

const bugun = new Date();
const tarihStr = (offset) => {
  const d = new Date(bugun);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
};

const INITIAL_SAYIMLAR = [
  { id: "S001", lokasyonId: "L001", urunId: "U001", partiler: [{ koli: 12, skt: tarihStr(30) }, { koli: 8, skt: tarihStr(90) }], tarih: bugun.toISOString() },
  { id: "S002", lokasyonId: "L003", urunId: "U003", partiler: [{ koli: 20, skt: tarihStr(15) }], tarih: bugun.toISOString() },
];

// ─── UTILS ───────────────────────────────────────────────────────────────────
const gunFarki = (skt) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(skt);
  return Math.round((target - today) / 86400000);
};

const sktRenk = (skt) => {
  const gun = gunFarki(skt);
  if (gun < 0) return "#ef4444";
  if (gun <= 30) return "#f97316";
  if (gun <= 90) return "#eab308";
  return "#22c55e";
};

const csvIndir = (sayimlar, urunler, lokasyonlar) => {
  const baslik = ["Lokasyon", "Ürün Kodu", "Ürün Adı", "Koli Miktarı", "SKT", "Kalan Gün", "Sayım Tarihi"];
  const satirlar = [];
  sayimlar.forEach((s) => {
    const lok = lokasyonlar.find((l) => l.id === s.lokasyonId);
    const urun = urunler.find((u) => u.id === s.urunId);
    s.partiler.forEach((p) => {
      satirlar.push([
        lok?.kod || "",
        urun?.kod || "",
        urun?.ad || "",
        p.koli,
        p.skt,
        gunFarki(p.skt),
        new Date(s.tarih).toLocaleDateString("tr-TR"),
      ]);
    });
  });
  const icerik = [baslik, ...satirlar].map((r) => r.join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + icerik], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fifo-rapor-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
};

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const useStorage = (key, initial) => {
  const [val, setVal] = useState(() => {
    try {
      const stored = window._appStorage?.[key];
      return stored ? JSON.parse(stored) : initial;
    } catch {
      return initial;
    }
  });
  const save = useCallback((v) => {
    setVal(v);
    if (!window._appStorage) window._appStorage = {};
    window._appStorage[key] = JSON.stringify(v);
  }, [key]);
  return [val, save];
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@400;500;600;700;800&family=Barlow:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0d1117;
    --bg2: #161b22;
    --bg3: #21262d;
    --border: #30363d;
    --text: #e6edf3;
    --text2: #8b949e;
    --accent: #f0883e;
    --accent2: #ff6b35;
    --green: #3fb950;
    --red: #f85149;
    --yellow: #d29922;
    --blue: #58a6ff;
    --purple: #bc8cff;
  }

  body { background: var(--bg); color: var(--text); font-family: 'Barlow', sans-serif; min-height: 100vh; }

  .app { display: flex; flex-direction: column; min-height: 100vh; }

  /* HEADER */
  .header {
    background: var(--bg2);
    border-bottom: 2px solid var(--accent);
    padding: 0 20px;
    display: flex; align-items: center; justify-content: space-between;
    height: 60px; position: sticky; top: 0; z-index: 100;
  }
  .header-logo {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 22px; font-weight: 800; letter-spacing: 1px;
    color: var(--accent);
    display: flex; align-items: center; gap: 8px;
  }
  .header-logo span { color: var(--text); font-weight: 400; }
  .header-nav { display: flex; gap: 4px; }
  .nav-btn {
    padding: 6px 14px; border-radius: 6px; border: 1px solid transparent;
    background: transparent; color: var(--text2); cursor: pointer;
    font-family: 'Barlow Condensed', sans-serif; font-size: 14px; font-weight: 600;
    letter-spacing: 0.5px; transition: all 0.15s;
  }
  .nav-btn:hover { background: var(--bg3); color: var(--text); }
  .nav-btn.active { background: var(--accent); color: #000; border-color: var(--accent); }
  .role-badge {
    padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
    font-family: 'Space Mono', monospace; letter-spacing: 0.5px;
  }
  .role-badge.personel { background: rgba(88,166,255,0.15); color: var(--blue); border: 1px solid rgba(88,166,255,0.3); }
  .role-badge.admin { background: rgba(240,136,62,0.15); color: var(--accent); border: 1px solid rgba(240,136,62,0.3); }

  /* MAIN */
  .main { flex: 1; padding: 24px 20px; max-width: 900px; margin: 0 auto; width: 100%; }

  /* CARDS */
  .card {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 10px; overflow: hidden;
  }
  .card-header {
    padding: 14px 18px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .card-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 16px; font-weight: 700; letter-spacing: 0.5px; color: var(--text);
  }
  .card-body { padding: 18px; }

  /* LOKASYON LİSTESİ */
  .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
  .stat-box {
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 8px; padding: 14px 16px;
  }
  .stat-label { font-size: 11px; color: var(--text2); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .stat-val { font-family: 'Space Mono', monospace; font-size: 28px; font-weight: 700; }
  .stat-val.green { color: var(--green); }
  .stat-val.orange { color: var(--accent); }
  .stat-val.blue { color: var(--blue); }

  .search-bar {
    width: 100%; padding: 10px 14px;
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); font-size: 14px;
    margin-bottom: 14px; outline: none; font-family: 'Barlow', sans-serif;
  }
  .search-bar:focus { border-color: var(--accent); }

  .lokasyon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
  .lok-card {
    border: 1px solid var(--border); border-radius: 8px;
    padding: 14px; cursor: pointer; transition: all 0.15s;
    background: var(--bg3); position: relative; overflow: hidden;
  }
  .lok-card:hover { border-color: var(--accent); transform: translateY(-1px); }
  .lok-card.tamamlandi { border-color: rgba(63,185,80,0.4); background: rgba(63,185,80,0.05); }
  .lok-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: var(--border);
  }
  .lok-card.tamamlandi::before { background: var(--green); }
  .lok-kod {
    font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700;
    color: var(--text); margin-bottom: 4px;
  }
  .lok-urun { font-size: 11px; color: var(--text2); margin-bottom: 8px; line-height: 1.3; }
  .lok-status {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
    padding: 2px 8px; border-radius: 20px;
    font-family: 'Barlow Condensed', sans-serif;
  }
  .lok-status.bekliyor { background: rgba(139,148,158,0.15); color: var(--text2); }
  .lok-status.tamamlandi { background: rgba(63,185,80,0.15); color: var(--green); }

  /* SAYIM EKRANI */
  .breadcrumb {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: var(--text2); margin-bottom: 20px;
  }
  .breadcrumb button { background: none; border: none; color: var(--accent); cursor: pointer; font-size: 13px; font-family: 'Barlow', sans-serif; }
  .breadcrumb span { color: var(--border); }

  .urun-bilgi {
    background: linear-gradient(135deg, rgba(240,136,62,0.1), rgba(240,136,62,0.03));
    border: 1px solid rgba(240,136,62,0.3);
    border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;
    display: flex; align-items: center; gap: 16px;
  }
  .urun-bilgi-icon {
    width: 44px; height: 44px; border-radius: 8px;
    background: rgba(240,136,62,0.2); display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }
  .urun-bilgi-kod { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--accent); margin-bottom: 2px; }
  .urun-bilgi-ad { font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 700; }

  .parti-listesi { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
  .parti-row {
    display: grid; grid-template-columns: 1fr 1fr auto;
    gap: 10px; align-items: end;
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: 8px; padding: 12px;
  }
  .parti-num {
    grid-column: 1/-1;
    font-size: 11px; color: var(--text2); font-weight: 600;
    letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px;
    font-family: 'Barlow Condensed', sans-serif;
  }
  .field-label { font-size: 12px; color: var(--text2); margin-bottom: 4px; font-weight: 500; }
  .field-input {
    width: 100%; padding: 10px 12px;
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 6px; color: var(--text); font-size: 15px;
    outline: none; font-family: 'Barlow', sans-serif; transition: border-color 0.15s;
  }
  .field-input:focus { border-color: var(--accent); }
  .del-btn {
    width: 36px; height: 36px; border-radius: 6px;
    background: rgba(248,81,73,0.1); border: 1px solid rgba(248,81,73,0.3);
    color: var(--red); cursor: pointer; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s; align-self: flex-end;
  }
  .del-btn:hover { background: rgba(248,81,73,0.2); }

  .btn-ekle {
    width: 100%; padding: 10px; border-radius: 8px;
    background: rgba(88,166,255,0.1); border: 1px dashed rgba(88,166,255,0.4);
    color: var(--blue); cursor: pointer; font-size: 14px; font-weight: 600;
    font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.5px;
    transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .btn-ekle:hover { background: rgba(88,166,255,0.2); border-color: rgba(88,166,255,0.6); }

  .btn-kaydet {
    width: 100%; padding: 14px; border-radius: 8px;
    background: var(--accent); border: none;
    color: #000; font-size: 16px; font-weight: 800;
    font-family: 'Barlow Condensed', sans-serif; letter-spacing: 1px;
    cursor: pointer; transition: all 0.15s; margin-top: 16px;
    text-transform: uppercase;
  }
  .btn-kaydet:hover { background: var(--accent2); transform: translateY(-1px); }

  /* ADMIN PANEL */
  .tab-row { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 0; }
  .tab-btn {
    padding: 8px 16px; border: none; background: none;
    color: var(--text2); cursor: pointer; font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px; font-weight: 600; letter-spacing: 0.5px;
    border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s;
  }
  .tab-btn:hover { color: var(--text); }
  .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-group { display: flex; flex-direction: column; gap: 4px; }
  .form-group.full { grid-column: 1/-1; }
  .form-label { font-size: 12px; color: var(--text2); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input {
    padding: 10px 12px; background: var(--bg3); border: 1px solid var(--border);
    border-radius: 6px; color: var(--text); font-size: 14px; outline: none;
    font-family: 'Barlow', sans-serif; transition: border-color 0.15s;
  }
  .form-input:focus { border-color: var(--accent); }
  .form-select {
    padding: 10px 12px; background: var(--bg3); border: 1px solid var(--border);
    border-radius: 6px; color: var(--text); font-size: 14px; outline: none;
    font-family: 'Barlow', sans-serif;
  }
  .btn-ekle-form {
    padding: 10px 20px; background: var(--accent); border: none;
    color: #000; border-radius: 6px; font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px;
    transition: all 0.15s;
  }
  .btn-ekle-form:hover { background: var(--accent2); }

  /* RAPOR TABLOSU */
  .rapor-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .btn-export {
    padding: 8px 16px; background: rgba(63,185,80,0.1);
    border: 1px solid rgba(63,185,80,0.4); color: var(--green);
    border-radius: 6px; cursor: pointer; font-family: 'Barlow Condensed', sans-serif;
    font-size: 14px; font-weight: 700; letter-spacing: 0.5px;
    display: flex; align-items: center; gap: 6px; transition: all 0.15s;
  }
  .btn-export:hover { background: rgba(63,185,80,0.2); }

  .tablo-wrapper { overflow-x: auto; }
  .rapor-tablo { width: 100%; border-collapse: collapse; font-size: 13px; }
  .rapor-tablo th {
    background: var(--bg3); color: var(--text2);
    font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700;
    letter-spacing: 1px; text-transform: uppercase;
    padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--border);
  }
  .rapor-tablo td { padding: 10px 12px; border-bottom: 1px solid rgba(48,54,61,0.5); }
  .rapor-tablo tr:last-child td { border-bottom: none; }
  .rapor-tablo tr:hover td { background: rgba(255,255,255,0.02); }
  .skt-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; border-radius: 4px; font-size: 11px;
    font-family: 'Space Mono', monospace; font-weight: 700;
  }
  .lok-pill {
    font-family: 'Space Mono', monospace; font-size: 11px;
    background: var(--bg3); border: 1px solid var(--border);
    padding: 2px 6px; border-radius: 4px; color: var(--blue);
  }
  .empty-state {
    text-align: center; padding: 48px; color: var(--text2);
    font-family: 'Barlow Condensed', sans-serif; font-size: 16px;
  }
  .empty-icon { font-size: 40px; margin-bottom: 12px; }

  /* LIST ITEMS (urun/lok management) */
  .list-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px; border-radius: 6px;
    background: var(--bg3); border: 1px solid var(--border); margin-bottom: 6px;
  }
  .list-item-info { flex: 1; }
  .list-item-kod { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--accent); }
  .list-item-ad { font-size: 13px; color: var(--text); margin-top: 1px; }
  .list-item-del {
    width: 28px; height: 28px; border-radius: 4px;
    background: none; border: none; color: var(--text2); cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 14px;
    transition: color 0.15s;
  }
  .list-item-del:hover { color: var(--red); }

  .toast {
    position: fixed; bottom: 24px; right: 24px;
    background: var(--green); color: #000; padding: 12px 20px;
    border-radius: 8px; font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px; font-weight: 700; z-index: 999;
    animation: slideIn 0.2s ease; letter-spacing: 0.5px;
  }
  @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

  .divider { height: 1px; background: var(--border); margin: 16px 0; }

  .fifo-uyari {
    background: rgba(248,81,73,0.08); border: 1px solid rgba(248,81,73,0.3);
    border-radius: 8px; padding: 10px 14px; margin-bottom: 14px;
    font-size: 13px; color: var(--red); display: flex; align-items: center; gap: 8px;
  }

  @media (max-width: 600px) {
    .stats-row { grid-template-columns: 1fr 1fr; }
    .lokasyon-grid { grid-template-columns: repeat(2, 1fr); }
    .form-grid { grid-template-columns: 1fr; }
    .header { padding: 0 12px; }
    .header-logo { font-size: 18px; }
    .nav-btn { padding: 5px 10px; font-size: 12px; }
    .main { padding: 16px 12px; }
    .parti-row { grid-template-columns: 1fr 1fr auto; }
  }
`;

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Toast({ mesaj, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className="toast">✓ {mesaj}</div>;
}

function LokasyonListesi({ lokasyonlar, urunler, sayimlar, onSec }) {
  const [arama, setArama] = useState("");
  const filtered = lokasyonlar.filter((l) => l.kod.toLowerCase().includes(arama.toLowerCase()));
  const tamamlanan = lokasyonlar.filter((l) => sayimlar.some((s) => s.lokasyonId === l.id)).length;

  return (
    <div>
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-label">Toplam Lokasyon</div>
          <div className="stat-val blue">{lokasyonlar.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Tamamlandı</div>
          <div className="stat-val green">{tamamlanan}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Bekleyen</div>
          <div className="stat-val orange">{lokasyonlar.length - tamamlanan}</div>
        </div>
      </div>

      <input
        className="search-bar"
        placeholder="🔍  Lokasyon ara... (örn: A-01)"
        value={arama}
        onChange={(e) => setArama(e.target.value)}
      />

      <div className="lokasyon-grid">
        {filtered.map((lok) => {
          const urun = urunler.find((u) => u.id === lok.urunId);
          const sayildi = sayimlar.some((s) => s.lokasyonId === lok.id);
          return (
            <div
              key={lok.id}
              className={`lok-card ${sayildi ? "tamamlandi" : ""}`}
              onClick={() => onSec(lok)}
            >
              <div className="lok-kod">{lok.kod}</div>
              <div className="lok-urun">{urun?.ad || "—"}</div>
              <div className={`lok-status ${sayildi ? "tamamlandi" : "bekliyor"}`}>
                {sayildi ? "✓ TAMAMLANDI" : "◉ BEKLİYOR"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SayimEkrani({ lokasyon, urunler, sayimlar, onKaydet, onGeri, lokasyonlar }) {
  const urun = urunler.find((u) => u.id === lokasyon.urunId);
  const mevcutSayim = sayimlar.find((s) => s.lokasyonId === lokasyon.id);

  const [partiler, setPartiler] = useState(
    mevcutSayim?.partiler || [{ koli: "", skt: "" }]
  );

  const partiGuncelle = (i, alan, val) => {
    const yeni = [...partiler];
    yeni[i] = { ...yeni[i], [alan]: val };
    setPartiler(yeni);
  };

  const partiEkle = () => setPartiler([...partiler, { koli: "", skt: "" }]);
  const partiSil = (i) => partiler.length > 1 && setPartiler(partiler.filter((_, idx) => idx !== i));

  const kaydet = () => {
    const gecerli = partiler.filter((p) => p.koli && p.skt);
    if (!gecerli.length) return alert("En az bir geçerli parti giriniz.");
    onKaydet(lokasyon.id, lokasyon.urunId, gecerli);
  };

  const lokIdx = lokasyonlar.findIndex((l) => l.id === lokasyon.id);
  const sonrakiLok = lokasyonlar[lokIdx + 1];

  const yaklaşanSkt = partiler.filter((p) => p.skt && gunFarki(p.skt) <= 30 && gunFarki(p.skt) >= 0);

  return (
    <div>
      <div className="breadcrumb">
        <button onClick={onGeri}>← Lokasyonlar</button>
        <span>/</span>
        <span>{lokasyon.kod}</span>
      </div>

      <div className="urun-bilgi">
        <div className="urun-bilgi-icon">📦</div>
        <div>
          <div className="urun-bilgi-kod">{urun?.kod}</div>
          <div className="urun-bilgi-ad">{urun?.ad || "Ürün bulunamadı"}</div>
        </div>
        {urun?.rafOmru && (
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--text2)" }}>RAF ÖMRÜ</div>
            <div style={{ fontFamily: "Space Mono, monospace", color: "var(--accent)", fontWeight: 700 }}>
              {urun.rafOmru} gün
            </div>
          </div>
        )}
      </div>

      {yaklaşanSkt.length > 0 && (
        <div className="fifo-uyari">
          ⚠️ {yaklaşanSkt.length} parti SKT'si 30 gün içinde! FIFO önceliği verin.
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Parti Girişi</div>
          <span style={{ fontSize: 12, color: "var(--text2)" }}>{partiler.length} parti</span>
        </div>
        <div className="card-body">
          <div className="parti-listesi">
            {partiler.map((p, i) => (
              <div key={i} className="parti-row">
                <div className="parti-num" style={{ gridColumn: "1/-1" }}>
                  Parti {i + 1}
                </div>
                <div>
                  <div className="field-label">Koli Miktarı</div>
                  <input
                    type="number"
                    className="field-input"
                    placeholder="0"
                    value={p.koli}
                    onChange={(e) => partiGuncelle(i, "koli", e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <div className="field-label">SKT (Son Kullanma)</div>
                  <input
                    type="date"
                    className="field-input"
                    value={p.skt}
                    onChange={(e) => partiGuncelle(i, "skt", e.target.value)}
                    style={p.skt ? { color: sktRenk(p.skt) } : {}}
                  />
                </div>
                <button className="del-btn" onClick={() => partiSil(i)} disabled={partiler.length === 1}>
                  ×
                </button>
              </div>
            ))}
          </div>

          <button className="btn-ekle" onClick={partiEkle}>
            + Yeni Parti / SKT Ekle
          </button>

          <button className="btn-kaydet" onClick={kaydet}>
            {sonrakiLok
              ? `Kaydet ve Sonrakine Geç → ${sonrakiLok.kod}`
              : "Kaydet ve Tamamla ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ urunler, lokasyonlar, sayimlar, setUrunler, setLokasyonlar }) {
  const [tab, setTab] = useState("rapor");
  const [yeniUrun, setYeniUrun] = useState({ kod: "", ad: "", rafOmru: "" });
  const [yeniLok, setYeniLok] = useState({ kod: "", urunId: "" });
  const [toast, setToast] = useState(null);

  const showToast = (m) => setToast(m);

  const urunEkle = () => {
    if (!yeniUrun.kod || !yeniUrun.ad) return;
    setUrunler([...urunler, { id: `U${Date.now()}`, ...yeniUrun }]);
    setYeniUrun({ kod: "", ad: "", rafOmru: "" });
    showToast("Ürün eklendi");
  };

  const lokEkle = () => {
    if (!yeniLok.kod || !yeniLok.urunId) return;
    setLokasyonlar([...lokasyonlar, { id: `L${Date.now()}`, ...yeniLok }]);
    setYeniLok({ kod: "", urunId: "" });
    showToast("Lokasyon eklendi");
  };

  // Tüm satırlar (her parti bir satır), SKT'ye göre sıralı
  const raporSatirlar = [];
  sayimlar.forEach((s) => {
    const lok = lokasyonlar.find((l) => l.id === s.lokasyonId);
    const urun = urunler.find((u) => u.id === s.urunId);
    s.partiler.forEach((p) => {
      raporSatirlar.push({
        lokKod: lok?.kod || "?",
        urunKod: urun?.kod || "?",
        urunAd: urun?.ad || "?",
        koli: p.koli,
        skt: p.skt,
        kalanGun: gunFarki(p.skt),
        tarih: new Date(s.tarih).toLocaleDateString("tr-TR"),
      });
    });
  });
  raporSatirlar.sort((a, b) => a.kalanGun - b.kalanGun);

  return (
    <div>
      {toast && <Toast mesaj={toast} onClose={() => setToast(null)} />}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "Barlow Condensed, sans-serif" }}>
          Admin Paneli
        </div>
        <div className="role-badge admin">YÖNETİCİ</div>
      </div>

      <div className="tab-row">
        {[["rapor", "📊 Özet Rapor"], ["urun", "📦 Ürünler"], ["lokasyon", "📍 Lokasyonlar"]].map(([k, l]) => (
          <button key={k} className={`tab-btn ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>

      {tab === "rapor" && (
        <div>
          <div className="rapor-header">
            <div className="card-title">Sayım Sonuçları — FIFO Sıralaması</div>
            <button className="btn-export" onClick={() => csvIndir(sayimlar, urunler, lokasyonlar)}>
              ↓ Excel/CSV İndir
            </button>
          </div>

          {raporSatirlar.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              Henüz sayım verisi yok
            </div>
          ) : (
            <div className="card">
              <div className="tablo-wrapper">
                <table className="rapor-tablo">
                  <thead>
                    <tr>
                      <th>Lokasyon</th>
                      <th>Ürün Kodu</th>
                      <th>Ürün Adı</th>
                      <th>Koli</th>
                      <th>SKT</th>
                      <th>Kalan Gün</th>
                      <th>Sayım</th>
                    </tr>
                  </thead>
                  <tbody>
                    {raporSatirlar.map((r, i) => {
                      const renk = sktRenk(r.skt);
                      const gecmis = r.kalanGun < 0;
                      return (
                        <tr key={i} style={gecmis ? { opacity: 0.6 } : {}}>
                          <td><span className="lok-pill">{r.lokKod}</span></td>
                          <td style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "var(--text2)" }}>{r.urunKod}</td>
                          <td>{r.urunAd}</td>
                          <td style={{ fontWeight: 700 }}>{r.koli}</td>
                          <td>
                            <span className="skt-badge" style={{ background: `${renk}20`, color: renk }}>
                              {r.skt}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: renk, fontFamily: "Space Mono, monospace", fontSize: 12, fontWeight: 700 }}>
                              {gecmis ? `−${Math.abs(r.kalanGun)}` : `+${r.kalanGun}`}
                            </span>
                          </td>
                          <td style={{ color: "var(--text2)", fontSize: 12 }}>{r.tarih}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "urun" && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title">Yeni Ürün Tanımla</div></div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <div className="form-label">Ürün Kodu</div>
                  <input className="form-input" placeholder="SKU-XXXX" value={yeniUrun.kod} onChange={(e) => setYeniUrun({ ...yeniUrun, kod: e.target.value })} />
                </div>
                <div className="form-group">
                  <div className="form-label">Raf Ömrü (Gün)</div>
                  <input type="number" className="form-input" placeholder="365" value={yeniUrun.rafOmru} onChange={(e) => setYeniUrun({ ...yeniUrun, rafOmru: e.target.value })} />
                </div>
                <div className="form-group full">
                  <div className="form-label">Ürün Adı</div>
                  <input className="form-input" placeholder="Ürün adını giriniz" value={yeniUrun.ad} onChange={(e) => setYeniUrun({ ...yeniUrun, ad: e.target.value })} />
                </div>
              </div>
              <div style={{ marginTop: 12, textAlign: "right" }}>
                <button className="btn-ekle-form" onClick={urunEkle}>+ Ürün Ekle</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Tanımlı Ürünler</div>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>{urunler.length} ürün</span>
            </div>
            <div className="card-body">
              {urunler.map((u) => (
                <div key={u.id} className="list-item">
                  <div className="list-item-info">
                    <div className="list-item-kod">{u.kod} · {u.rafOmru ? `${u.rafOmru} gün raf ömrü` : "Raf ömrü belirtilmemiş"}</div>
                    <div className="list-item-ad">{u.ad}</div>
                  </div>
                  <button className="list-item-del" onClick={() => setUrunler(urunler.filter((x) => x.id !== u.id))}>🗑</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "lokasyon" && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title">Yeni Lokasyon Ekle</div></div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <div className="form-label">Lokasyon Kodu</div>
                  <input className="form-input" placeholder="A-01-01" value={yeniLok.kod} onChange={(e) => setYeniLok({ ...yeniLok, kod: e.target.value })} />
                </div>
                <div className="form-group">
                  <div className="form-label">Ürün Ata</div>
                  <select className="form-select" value={yeniLok.urunId} onChange={(e) => setYeniLok({ ...yeniLok, urunId: e.target.value })}>
                    <option value="">Ürün seçin</option>
                    {urunler.map((u) => <option key={u.id} value={u.id}>{u.kod} — {u.ad}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 12, textAlign: "right" }}>
                <button className="btn-ekle-form" onClick={lokEkle}>+ Lokasyon Ekle</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Tanımlı Lokasyonlar</div>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>{lokasyonlar.length} lokasyon</span>
            </div>
            <div className="card-body">
              {lokasyonlar.map((l) => {
                const urun = urunler.find((u) => u.id === l.urunId);
                return (
                  <div key={l.id} className="list-item">
                    <div className="list-item-info">
                      <div className="list-item-kod">{l.kod}</div>
                      <div className="list-item-ad">{urun?.ad || "Ürün atanmamış"}</div>
                    </div>
                    <button className="list-item-del" onClick={() => setLokasyonlar(lokasyonlar.filter((x) => x.id !== l.id))}>🗑</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [rol, setRol] = useState("personel"); // personel | admin
  const [ekran, setEkran] = useState("liste"); // liste | sayim
  const [secilenLok, setSecilenLok] = useState(null);
  const [toast, setToast] = useState(null);

  const [urunler, setUrunler] = useStorage("urunler", INITIAL_URUNLER);
  const [lokasyonlar, setLokasyonlar] = useStorage("lokasyonlar", INITIAL_LOKASYONLAR);
  const [sayimlar, setSayimlar] = useStorage("sayimlar", INITIAL_SAYIMLAR);

  const lokSec = (lok) => {
    setSecilenLok(lok);
    setEkran("sayim");
  };

  const kaydet = (lokId, urunId, partiler) => {
    const yeni = sayimlar.filter((s) => s.lokasyonId !== lokId);
    const kayit = { id: `S${Date.now()}`, lokasyonId: lokId, urunId, partiler, tarih: new Date().toISOString() };
    setSayimlar([...yeni, kayit]);
    setToast("Sayım kaydedildi!");

    // Sonraki lokasyona geç
    const idx = lokasyonlar.findIndex((l) => l.id === lokId);
    const sonraki = lokasyonlar[idx + 1];
    if (sonraki) {
      setSecilenLok(sonraki);
    } else {
      setEkran("liste");
      setSecilenLok(null);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="header-logo">
            FIFO<span>depo</span>
          </div>
          <div className="header-nav">
            <button
              className={`nav-btn ${rol === "personel" && ekran !== "admin" ? "active" : ""}`}
              onClick={() => { setRol("personel"); setEkran("liste"); setSecilenLok(null); }}
            >
              📦 Sayım
            </button>
            <button
              className={`nav-btn ${ekran === "admin" ? "active" : ""}`}
              onClick={() => { setRol("admin"); setEkran("admin"); setSecilenLok(null); }}
            >
              ⚙️ Admin
            </button>
          </div>
          <div className={`role-badge ${ekran === "admin" ? "admin" : "personel"}`}>
            {ekran === "admin" ? "YÖNETİCİ" : "SAHA"}
          </div>
        </div>

        <div className="main">
          {toast && <Toast mesaj={toast} onClose={() => setToast(null)} />}

          {ekran === "liste" && (
            <LokasyonListesi
              lokasyonlar={lokasyonlar}
              urunler={urunler}
              sayimlar={sayimlar}
              onSec={lokSec}
            />
          )}

          {ekran === "sayim" && secilenLok && (
            <SayimEkrani
              lokasyon={secilenLok}
              urunler={urunler}
              sayimlar={sayimlar}
              lokasyonlar={lokasyonlar}
              onKaydet={kaydet}
              onGeri={() => { setEkran("liste"); setSecilenLok(null); }}
            />
          )}

          {ekran === "admin" && (
            <AdminPanel
              urunler={urunler}
              lokasyonlar={lokasyonlar}
              sayimlar={sayimlar}
              setUrunler={setUrunler}
              setLokasyonlar={setLokasyonlar}
            />
          )}
        </div>
      </div>
    </>
  );
}
