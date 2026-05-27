import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, X, ShieldAlert, Sparkles, BookOpen, Music, CheckCircle2, Play, Download, ArrowRight } from "lucide-react";

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "ko" | "en";
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose, lang }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          id="modal-overlay-how-to-use"
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            id="modal-card-how-to-use"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-dark)] rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 md:p-8 flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              id="btn-close-how-to-use-modal"
              onClick={onClose}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-dark)] border border-[var(--border-color)] hover:border-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-all"
              title={lang === "ko" ? "닫기" : "Close"}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title Block */}
            <div className="flex items-center gap-3 mb-5 border-b border-[var(--border-color)] pb-4">
              <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl text-amber-500">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[var(--text-dark)]">
                  {lang === "ko" ? "🌬️ O2 Topline MIDI 사용 설명서" : "🌬️ O2 Topline MIDI Guide"}
                </h2>
                <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                  {lang === "ko" 
                    ? "MIDI 기반 AI 협업 보컬 프레이징 저작도구 가이드" 
                    : "Interactive AI-assisted vocal phrasing & melody workstation"}
                </p>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 space-y-6 text-sm text-[var(--text-dark)] pr-1 leading-relaxed">
              
              {/* Introduction */}
              <div className="bg-[var(--card-sub-bg)] rounded-2xl p-4 border border-[var(--border-color)]/60 text-xs text-[var(--text-muted)] flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  {lang === "ko" ? (
                    <p>
                      <strong>O2 Topline MIDI</strong>는 자신의 미디 트랙 위에 감성적인 보컬 가이드 멜로디(멜로디 탑라인)를 손쉽게 AI 로보틱스와 실시간 협업하여 세공해 나가는 반응형 저작 플랫폼입니다. 인물 감정이 살아있는 보컬 밀당 컨트롤과 실시간 미디 시퀀싱 드로잉을 경험하세요!
                    </p>
                  ) : (
                    <p>
                      <strong>O2 Topline MIDI</strong> is an adaptive production workspace where you can seamlessly co-create sentimental vocal guide lines on top of your rhythm track. Experience biological phrasing control and high-performance piano roll sequencer drawing!
                    </p>
                  )}
                </div>
              </div>

              {/* Step By Step Sections */}
              <div className="space-y-5">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[var(--brand-color)] border-b border-[var(--border-color)]/40 pb-1 mb-3">
                  {lang === "ko" ? "핵심 워크플로우 & 작업 흐름" : "Core Workflows & Production Pipeline"}
                </h3>

                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-mint)] border border-[var(--accent-mint-border)] text-teal-800 text-xs font-extrabold">1</span>
                    <div className="w-0.5 flex-1 bg-[var(--border-color)]/40 my-1"></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-dark)] text-sm">
                      {lang === "ko" ? "드럼 & 신스 MIDI 수급" : "Integrate Drum & Synth Tracks"}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {lang === "ko" ? (
                        <>
                          작업 중인 멀티트랙, 드럼, 신스 MIDI 파일을 에디터 상단 드래그 박스에 던져 로드합니다. 마땅한 음원이 없을 때도 걱정 없습니다! 
                          우측 상단의 <strong>장르 드롭다운</strong>에서 감성 발라드, 시티팝, 다크 신스웨이브 등 20여 가지 완벽한 사전 제작 템플릿 세션을 선택해 바로 로딩할 수 있습니다. 템포(BPM) 및 조성(Scale)이 자동 파싱되어 대시보드에 표출됩니다.
                        </>
                      ) : (
                        <>
                          Drag and drop your personalized drum, synth, or multi-track MIDI files. No custom assets? 
                          No problem! Click the <strong>Genre dropdown</strong> right above to choose from 20 preloaded, professional templates which immediately update key scale signature, BPM indicators, and rhythmic layouts.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-pink)] border border-[var(--accent-pink-border)] text-pink-800 text-xs font-extrabold">2</span>
                    <div className="w-0.5 flex-1 bg-[var(--border-color)]/40 my-1"></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-dark)] text-sm">
                      {lang === "ko" ? "AI 협업 오토-파일럿 생성 제어" : "AI Co-Create & Vocal Phrasing Slider"}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {lang === "ko" ? (
                        <>
                          일정한 규칙에 구속받아 작곡이 막혔을 때는 <strong>AI 협업 모드</strong>를 켜두세요! 
                          그 다음, <strong>보컬 스타일 밀당 슬라이더</strong>를 피칭해 창법의 조성을 변경합니다. 낮은 단계(Lvl 1~3)는 한 호흡에 길게 쭉 뻗는 감동 어린 발라드 타입이며, 높은 단계(Lvl 8~10)는 짧은 호흡으로 수없이 몰아치는 현란한 댄스 및 트랩 랩 타입입니다. 🎲 <strong>주사위 콕콕 버튼</strong>을 누를 때마다 무작위 시드 속에서 명확한 멜로디 바리에이션이 지속해서 꽃을 피웁니다.
                        </>
                      ) : (
                        <>
                          Stuck on creative block? Toggle <strong>AI Co-Create</strong> mode on.
                          Then tune the <strong>Vocal Rest & Density slider</strong> on the panel. Lower levels generate highly emotive, elongated ballad structures, while upper values trigger extremely dense syllables suitable for rap, neo-soul rap, or active pop. Click 🎲 <strong>Roll Dice</strong> or switch seed values to generate dynamic and fresh topline variations perfectly matching target keys.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-lavender)] border border-[var(--accent-lavender-border)] text-indigo-800 text-xs font-extrabold">3</span>
                    <div className="w-0.5 flex-1 bg-[var(--border-color)]/40 my-1"></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-dark)] text-sm">
                      {lang === "ko" ? "수동 마우스 피아노 롤 드로잉 & 세부 정밀 튠" : "Manual Draw, Erase & Drag-and-Drop Transpose"}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {lang === "ko" ? (
                        <>
                          그린 멜로디를 미적으로 수정하거나 완전 정밀 깎기가 필요한 경우, <strong>Manual(AI 끄기)</strong> 모드로 변환합니다.
                          그리드 위에서 클릭 한 번으로 새 멜로디 노트를 추가하거나 기존 노트를 즉각 삭제할 수 있습니다. 
                          이미 그려진 노트의 음높이(Transpose) 또는 위상(Play step)을 가공하고 싶다면 마우스로 꾹 눌러 상하좌우 부드럽게 이송하는 드래그 마우스 에디팅과 🌬️ <strong>숨통(Rest) 버튼</strong>을 통한 발성 쉼표 세공을 만끽해 보세요!
                        </>
                      ) : (
                        <>
                          Toggle <strong>AI Off (Edit)</strong> to perfect the melody manually.
                          Simply click on empty blocks to draw notes instantly or click on existing notes to erase.
                          To fine-tune composition, grab any block and drag it vertically (transpose key) or horizontally (shift phrasing steps) for lightning-fast sequencing edits. Integrate 🌬️ <strong>Vocal Rest</strong> items to build emotional tension.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border border-[var(--border-color)] text-[var(--text-dark)] text-xs font-extrabold">4</span>
                    <div className="w-0.5 flex-1 bg-[var(--border-color)]/40 my-1"></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-dark)] text-sm">
                      {lang === "ko" ? "실시간 청음 & 보컬 가이드 연동" : "Audition Local Synthesizer and Metronome Track"}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {lang === "ko" ? (
                        <>
                          <strong>재생(Play) / 정지(Stop)</strong> 도구를 클릭하면 가이드 드럼 셋, 신스 코드 흐름, 메트로놈 똑딱이와 합성된 보컬 가이드 선율이 가볍고 쾌적한 Tone.js 오디오 합성기를 거쳐 입체적으로 함께 회전합니다. 플레이 백 도중 마우스 드로잉을 가미해도 사운드가 실시간 반영되고, 재생 속도 슬라이더 및 루프 한계 지정(1Bar ~ 4Bar)을 실시간 바인딩할 수 있습니다.
                        </>
                      ) : (
                        <>
                          Use the **Play** tool. Tone.js handles local zero-latency audio, overlaying dynamic virtual drum elements, backing chord sections, and high-performance metronome click ticks alongside the vocal topline. Adjust bar bounds (1Bar - 4Bar length) on-the-fly and edit notes even during active play for immediate audio response.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400 text-xs font-extrabold">5</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-dark)] text-sm">
                      {lang === "ko" ? "크로스 오버 레코딩 파이프라인 (BandLab ➡️ Suno AI)" : "The Ultimate Production Pipeline: BandLab ➡️ Suno AI"}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {lang === "ko" ? (
                        <>
                          작업이 끝났다면 피아노 마크업인 **탑라인만 내보내기(.mid)** 또는 풍족한 짜임새의 **멀티트랙 내보내기**를 저장합니다.
                          다운로드한 미디 파일을 무료 온라인 DAW 플랫폼인 <strong>BandLab(밴드랩)</strong>에 드래그하여 올린 뒤 적합한 악기 톤(Vocal, Piano synth 등)을 입히고, 완성된 오디오 가이드를 <strong>Suno AI</strong> 등 생성형 인공지능 음악 모델에 레퍼런스로 주입하면 프로 오리지널 명반이 최종 마스터링 처리되어 발매 대기 상태를 가집니다!
                        </>
                      ) : (
                        <>
                          Export your compositions via **Export Topline Only** (.mid) or **Export Multi-track** (drums, arpeggiated synths, and topline merged).
                          Drop your MIDI directly into the free online DAW <strong>BandLab</strong> to apply luxurious sound fonts, then load as a reference melody in <strong>Suno AI</strong> or similar platform to polish, master, and export a radio-ready chart-topper!
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tips Callout */}
              <div className="bg-amber-500/5 rounded-2xl p-4 border border-amber-500/10 text-xs space-y-2 mt-4 text-amber-900 dark:text-amber-200">
                <h4 className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  {lang === "ko" ? "이용 꿀팁!" : "Pro Tips!"}
                </h4>
                <ul className="list-disc pl-5 space-y-1 hover:text-[var(--text-dark)] transition-colors">
                  {lang === "ko" ? (
                    <>
                      <li><strong>마디 잠금 기능(Padlock 🔒)</strong>: 피아노 롤 상단의 마디 번호 옆 자물쇠 버튼을 채워두면, AI 주사위를 굴려도 해당 마디 선율만은 그대로 남아있어 부분 변주가 수월해집니다.</li>
                      <li><strong>스파크 가이드 조명</strong>: 리듬과 멜로디 보정이 진행될수록 그리드가 은은한 보랏빛 백라이트로 반응하여, 눈을 편안하게 조명하고 이상적인 음 맞춤 가이드를 돕습니다.</li>
                    </>
                  ) : (
                    <>
                      <li><strong>Bar Locking (🔒 Padlock)</strong>: Click the small padlock icons atop musical bars in the Piano Roll. Locked sections will be preserved when rolling new AI melodies, giving you maximum selective revision control.</li>
                      <li><strong>Ambient Beacon</strong>: The piano roll backlights reactive 16th-note grids gently when rhythm highlights align perfectly, keeping eyes relaxed and guiding harmonious pitch steps.</li>
                    </>
                  )}
                </ul>
              </div>

            </div>

            {/* Modal Footer Banner */}
            <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)] font-mono font-medium">O2 Production pipeline Standard v0.5</span>
              <button
                id="btn-close-how-to-use-footer"
                onClick={onClose}
                className="cursor-pointer bg-[var(--brand-color)] text-white font-bold py-2 px-5 rounded-full hover:opacity-90 active:scale-95 transition-all"
              >
                {lang === "ko" ? "이해했습니다" : "Got it!"}
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
