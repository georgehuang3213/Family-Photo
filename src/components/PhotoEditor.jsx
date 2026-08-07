import React, { useState, useRef, useEffect } from 'react';
import { 
  RotateCw, FlipHorizontal, Crop, Sparkles, Sliders, Type, 
  Check, X, Wand2, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

const FILTERS = [
  { id: 'normal', name: '原圖 (Normal)', filterStr: 'none' },
  { id: 'warm', name: '☀️ 暖陽復古', filterStr: 'brightness(105%) contrast(110%) saturate(125%) sepia(20%)' },
  { id: 'vintage', name: '📜 歲月懷舊', filterStr: 'sepia(45%) contrast(90%) brightness(95%) hue-rotate(-10deg)' },
  { id: 'bw', name: '🖤 經典黑白', filterStr: 'grayscale(100%) contrast(125%)' },
  { id: 'japanese', name: '🌸 日系清新', filterStr: 'brightness(112%) saturate(85%) contrast(95%)' },
  { id: 'dramatic', name: '🎬 鮮豔電影', filterStr: 'contrast(135%) saturate(140%)' }
];

export default function PhotoEditor({ photo, onClose, onSave }) {
  const [rotation, setRotation] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeTab, setActiveTab] = useState('filters'); // 'filters' | 'adjust' | 'crop' | 'watermark'
  const [selectedFilter, setSelectedFilter] = useState('normal');

  // Manual adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sepia, setSepia] = useState(0);
  const [blur, setBlur] = useState(0);

  // Watermark text
  const [watermarkText, setWatermarkText] = useState('❤️ 家族相簿紀錄 2026');
  const [watermarkColor, setWatermarkColor] = useState('#ffffff');
  const [showWatermark, setShowWatermark] = useState(false);

  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load Image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.url;
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
  }, [photo.url]);

  // Render to canvas whenever adjustments change
  useEffect(() => {
    if (!imageLoaded || !imgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    // Handle Rotation dimensions
    const isVertical = rotation % 180 !== 0;
    canvas.width = isVertical ? img.height : img.width;
    canvas.height = isVertical ? img.width : img.height;

    ctx.save();

    // Move origin to center for rotation/flipping
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(isFlipped ? -1 : 1, 1);

    // Apply Filter & Adjustments string
    const filterItem = FILTERS.find(f => f.id === selectedFilter);
    let filterString = filterItem && filterItem.id !== 'normal' ? filterItem.filterStr : '';
    
    // Add manual CSS filter string
    const manualFilters = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) sepia(${sepia}%) blur(${blur}px)`;
    ctx.filter = filterString !== 'none' ? `${filterString} ${manualFilters}` : manualFilters;

    // Draw Image
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    // Add Watermark if enabled
    if (showWatermark && watermarkText.trim()) {
      ctx.restore(); // Restore filter context to avoid filter affecting text
      ctx.save();
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = watermarkColor;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(watermarkText, 40, canvas.height - 50);
    }

    ctx.restore();
  }, [imageLoaded, rotation, isFlipped, selectedFilter, brightness, contrast, saturation, sepia, blur, showWatermark, watermarkText, watermarkColor]);

  const handleReset = () => {
    setRotation(0);
    setIsFlipped(false);
    setSelectedFilter('normal');
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSepia(0);
    setBlur(0);
    setShowWatermark(false);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const editedUrl = canvasRef.current.toDataURL('image/jpeg', 0.92);
    
    // Trigger celebratory confetti effect
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    onSave(photo.id, editedUrl);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel animate-fade-in" style={{ width: '92vw', maxWidth: '1100px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Modal Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gradient-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wand2 size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>線上照片編輯器</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{photo.title}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={handleReset} style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
              <RefreshCw size={14} /> 重設
            </button>
            <button className="btn btn-primary" onClick={handleSave} style={{ fontSize: '0.88rem', padding: '8px 18px' }}>
              <Check size={16} /> 儲存至雲端
            </button>
            <button className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flex: 1, minHeight: '0', overflow: 'hidden' }}>
          
          {/* Main Canvas Viewport */}
          <div style={{ flex: 1, background: '#04070d', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
            {!imageLoaded && (
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw className="animate-spin" size={20} /> 正在從雲端下載高畫質照片...
              </div>
            )}
            <canvas 
              ref={canvasRef} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)' 
              }} 
            />
          </div>

          {/* Sidebar Controls */}
          <div style={{ width: '320px', borderLeft: '1px solid var(--border-subtle)', background: 'rgba(12, 18, 30, 0.95)', display: 'flex', flexDirection: 'column' }}>
            
            {/* Tabs Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
              <button 
                onClick={() => setActiveTab('filters')}
                style={{ 
                  flex: 1, padding: '12px 8px', background: 'none', border: 'none', 
                  color: activeTab === 'filters' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'filters' ? '2px solid var(--accent-primary)' : 'none',
                  fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                <Sparkles size={15} /> 濾鏡
              </button>
              <button 
                onClick={() => setActiveTab('adjust')}
                style={{ 
                  flex: 1, padding: '12px 8px', background: 'none', border: 'none', 
                  color: activeTab === 'adjust' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'adjust' ? '2px solid var(--accent-primary)' : 'none',
                  fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                <Sliders size={15} /> 光影微調
              </button>
              <button 
                onClick={() => setActiveTab('crop')}
                style={{ 
                  flex: 1, padding: '12px 8px', background: 'none', border: 'none', 
                  color: activeTab === 'crop' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'crop' ? '2px solid var(--accent-primary)' : 'none',
                  fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                <Crop size={15} /> 旋轉翻轉
              </button>
              <button 
                onClick={() => setActiveTab('watermark')}
                style={{ 
                  flex: 1, padding: '12px 8px', background: 'none', border: 'none', 
                  color: activeTab === 'watermark' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === 'watermark' ? '2px solid var(--accent-primary)' : 'none',
                  fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                <Type size={15} /> 浮水印
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
              
              {/* FILTERS TAB */}
              {activeTab === 'filters' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {FILTERS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilter(f.id)}
                      style={{
                        padding: '14px 10px',
                        borderRadius: '10px',
                        background: selectedFilter === f.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        border: selectedFilter === f.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        color: selectedFilter === f.id ? '#fff' : 'var(--text-muted)',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}>
                      {f.name}
                    </button>
                  ))}
                </div>
              )}

              {/* ADJUSTMENTS TAB */}
              {activeTab === 'adjust' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <span>☀️ 亮度 (Brightness)</span>
                      <span>{brightness}%</span>
                    </div>
                    <input 
                      type="range" min="50" max="150" value={brightness} 
                      onChange={e => setBrightness(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-primary)' }} 
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <span>☯️ 對比度 (Contrast)</span>
                      <span>{contrast}%</span>
                    </div>
                    <input 
                      type="range" min="50" max="150" value={contrast} 
                      onChange={e => setContrast(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-primary)' }} 
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <span>🎨 飽和度 (Saturation)</span>
                      <span>{saturation}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="200" value={saturation} 
                      onChange={e => setSaturation(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-primary)' }} 
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <span>📜 復古色調 (Sepia)</span>
                      <span>{sepia}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" value={sepia} 
                      onChange={e => setSepia(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-primary)' }} 
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <span>💧 景深模糊 (Blur)</span>
                      <span>{blur}px</span>
                    </div>
                    <input 
                      type="range" min="0" max="10" value={blur} 
                      onChange={e => setBlur(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-primary)' }} 
                    />
                  </div>
                </div>
              )}

              {/* ROTATE & FLIP TAB */}
              {activeTab === 'crop' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <button className="btn btn-secondary" onClick={() => setRotation(r => (r + 90) % 360)} style={{ width: '100%', justifyContent: 'flex-start' }}>
                    <RotateCw size={16} /> 順時針旋轉 90° (目前: {rotation}°)
                  </button>
                  <button className="btn btn-secondary" onClick={() => setIsFlipped(f => !f)} style={{ width: '100%', justifyContent: 'flex-start' }}>
                    <FlipHorizontal size={16} /> 左右鏡像翻轉 ({isFlipped ? '已翻轉' : '正常'})
                  </button>
                </div>
              )}

              {/* WATERMARK TAB */}
              {activeTab === 'watermark' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={showWatermark} 
                      onChange={e => setShowWatermark(e.target.checked)} 
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                    />
                    啟用家族文字註記/浮水印
                  </label>

                  {showWatermark && (
                    <>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>註記文字：</label>
                        <input 
                          type="text"
                          value={watermarkText}
                          onChange={e => setWatermarkText(e.target.value)}
                          className="search-input"
                          style={{ paddingLeft: '14px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>文字顏色：</label>
                        <input 
                          type="color" 
                          value={watermarkColor}
                          onChange={e => setWatermarkColor(e.target.value)}
                          style={{ width: '100%', height: '38px', borderRadius: '8px', border: '1px solid var(--border-subtle)', cursor: 'pointer', background: 'none' }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
