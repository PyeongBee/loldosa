import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import './App.css'

interface Champion {
  name: string;
  position: string;
}

interface TeamData {
  champions: Champion[];
}

interface Analysis {
  teamComp: string;
  strengths: string[];
  weaknesses: string[];
  strategy: string;
  winCondition: string;
}

interface N8nResponse {
  md?: string;
  analysis?: Analysis;
}

function App() {
  const [blueTeam, setBlueTeam] = useState<Champion[]>([
    { name: '', position: 'TOP' },
    { name: '', position: 'JGL' },
    { name: '', position: 'MID' },
    { name: '', position: 'ADC' },
    { name: '', position: 'SUP' }
  ]);
  
  const [redTeam, setRedTeam] = useState<Champion[]>([
    { name: '', position: 'TOP' },
    { name: '', position: 'JGL' },
    { name: '', position: 'MID' },
    { name: '', position: 'ADC' },
    { name: '', position: 'SUP' }
  ]);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  const updateChampion = (team: 'blue' | 'red', index: number, name: string) => {
    const setTeam = team === 'blue' ? setBlueTeam : setRedTeam;
    const currentTeam = team === 'blue' ? blueTeam : redTeam;
    
    const newTeam = [...currentTeam];
    newTeam[index] = { ...newTeam[index], name };
    setTeam(newTeam);
  };

  // n8n 웹훅으로 데이터 전송
  const sendToN8nWebhook = async (teamData: TeamData) => {
    if (!webhookUrl.trim()) {
      alert('웹훅 URL을 입력해주세요!');
      return null;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('웹훅 전송 실패:', error);
      
      // 더 상세한 에러 메시지 제공
      let errorMessage = 'n8n 워크플로우 호출에 실패했습니다.';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage += ' 네트워크 연결을 확인하거나 CORS 설정을 확인해주세요.';
        } else {
          errorMessage += ` 오류: ${error.message}`;
        }
      }
      errorMessage += '\n\n로컬 분석으로 대체됩니다.';
      
      alert(errorMessage);
      return null;
    }
  };

  const analyzeTeamComposition = async () => {
    const blueChampions = blueTeam.filter(champ => champ.name.trim() !== '');
    const redChampions = redTeam.filter(champ => champ.name.trim() !== '');
    
    if (blueChampions.length < 5 || redChampions.length < 5) {
      alert('모든 챔피언을 입력해주세요!');
      return;
    }

    setIsLoading(true);

    // n8n으로 전송할 데이터 구성
    const webhookData = {
      timestamp: new Date().toISOString(),
      matchData: {
        blueTeam: blueChampions,
        redTeam: redChampions,
      },
      requestType: 'team_composition_analysis'
    };

    // n8n 웹훅으로 데이터 전송
    const webhookResult = await sendToN8nWebhook(webhookData);
    
    // 웹훅 결과 처리
    if (webhookResult) {
      // n8n에서 마크다운 응답이 온 경우
      if (webhookResult.md) {
        setMarkdownContent(webhookResult.md);
        setAnalysis(null); // 마크다운 모드일 때는 기존 분석 숨김
      } 
      // 기존 analysis 형식으로 온 경우
      else if (webhookResult.analysis) {
        setAnalysis(webhookResult.analysis);
        setMarkdownContent('');
      }
      // 응답이 있지만 형식이 다른 경우 - 전체를 마크다운으로 처리
      else {
        setMarkdownContent(JSON.stringify(webhookResult, null, 2));
        setAnalysis(null);
      }
    } else {
      // 웹훅 실패 시 로컬 분석 사용
      const localAnalysis = getLocalTeamAnalysis(blueChampions);
      setAnalysis(localAnalysis);
      setMarkdownContent('');
    }

    setIsLoading(false);
  };

  // 로컬 분석 함수 (백업용)
  const getLocalTeamAnalysis = (team: Champion[]): Analysis => {
    const champions = team.map(c => c.name.toLowerCase());
    
    // 기본적인 팀 구성 분류
    let teamComp = '균형잡힌 구성';
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // 탱커 체크
    const tanks = ['말파이트', '오른', '초가스', '마오카이', '잔나', '브라움', '레오나', '알리스타'];
    const tankCount = champions.filter(c => tanks.some(tank => c.includes(tank.toLowerCase()))).length;
    
    // 딜러 체크
    const adCarries = ['진', '베인', '카이사', '이즈리얼', '루시안', '징크스', '아펠리오스'];
    const adCount = champions.filter(c => adCarries.some(ad => c.includes(ad.toLowerCase()))).length;
    
    // 메이지 체크
    const mages = ['아지르', '오리아나', '신드라', '르블랑', '야스오', '제드'];
    const mageCount = champions.filter(c => mages.some(mage => c.includes(mage.toLowerCase()))).length;
    
    if (tankCount >= 2) {
      teamComp = '탱킹 중심 구성';
      strengths.push('강력한 탱킹 라인', '한타 이니시에이팅 우수');
      weaknesses.push('딜량 부족 가능성', '기동성 부족');
    }
    
    if (adCount >= 2) {
      strengths.push('후반 캐리력 우수', '오브젝트 처리 빠름');
      weaknesses.push('초반 약함', '어쌔신에 취약');
    }
    
    if (mageCount >= 2) {
      teamComp = '마법 딜 중심 구성';
      strengths.push('강력한 AoE 딜', '중거리 포킹 우수');
      weaknesses.push('마법 저항력에 취약', '마나 의존도 높음');
    }
    
    const strategy = tankCount >= 2 ? 
      '한타 위주의 플레이로 승부하세요. 이니시에이팅을 통해 주도권을 잡는 것이 중요합니다.' :
      '라인전에서 우위를 점하고 점진적으로 이득을 늘려가세요. 픽오프와 스플릿 푸시를 활용하세요.';
    
    const winCondition = adCount >= 2 ? 
      '후반까지 안정적으로 성장하여 원딜러가 캐리할 수 있는 환경을 만드세요.' :
      '중반 한타에서 우위를 점하고 빠르게 게임을 마무리하세요.';
    
    return {
      teamComp,
      strengths: strengths.length > 0 ? strengths : ['균형잡힌 팀 구성', '다양한 전략 가능'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['특별한 약점 없음', '상황에 따른 대응 필요'],
      strategy,
      winCondition
    };
  };

  return (
    <div className="app">
      <header className="header">
        <div className="character-teemo">🍄</div>
        <h1>롤 5대5 구도 분석기</h1>
        <p className="subtitle">League of Legends Team Composition Analyzer</p>
        <div className="character-penguin">🐧</div>
      </header>

      <div className="main-container">
        <div className="champion-input-section">
          <h2 className="section-title">챔피언 입력</h2>
          
          {/* n8n 웹훅 URL 입력 */}
          <div className="webhook-config">
            <label htmlFor="webhook-url" className="webhook-label">
              🔗 n8n 웹훅 URL
            </label>
            <input
              id="webhook-url"
              type="url"
              className="webhook-input"
              placeholder="https://your-n8n-instance.com/webhook/your-webhook-id"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>
          
          <div className="teams-container">
            <div className="team blue-team">
              <div className="team-title">블루팀</div>
              <div className="champion-inputs">
                {blueTeam.map((champion, index) => (
                  <div key={index} className="champion-input-group">
                    <input
                      type="text"
                      className="champion-input"
                      placeholder={`${champion.position} - 챔피언 이름`}
                      value={champion.name}
                      onChange={(e) => updateChampion('blue', index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="team red-team">
              <div className="team-title">레드팀</div>
              <div className="champion-inputs">
                {redTeam.map((champion, index) => (
                  <div key={index} className="champion-input-group">
                    <input
                      type="text"
                      className="champion-input"
                      placeholder={`${champion.position} - 챔피언 이름`}
                      value={champion.name}
                      onChange={(e) => updateChampion('red', index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button 
            className="analyze-button" 
            onClick={analyzeTeamComposition}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner">⚡</span>
                n8n 워크플로우 실행 중...
              </>
            ) : (
              '🔮 팀 구성 분석하기 🔮'
            )}
          </button>
        </div>

        <div className="analysis-section">
          <h2 className="section-title">분석 결과</h2>
          
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-animation">
                <span className="loading-spinner">⚡</span>
                <p>n8n 워크플로우에서 AI 분석 중...</p>
                <div className="loading-dots">
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                </div>
              </div>
                        </div>
          ) : markdownContent ? (
            <div className="analysis-results">
              <div className="analysis-header">
                <span className="analysis-source">
                  🤖 n8n AI 코치 분석 결과
                </span>
              </div>
              
              <div className="markdown-content">
                <ReactMarkdown 
                  components={{
                    h1: (props) => <h1 className="md-h1" {...props} />,
                    h2: (props) => <h2 className="md-h2" {...props} />,
                    h3: (props) => <h3 className="md-h3" {...props} />,
                    h4: (props) => <h4 className="md-h4" {...props} />,
                    p: (props) => <p className="md-p" {...props} />,
                    ul: (props) => <ul className="md-ul" {...props} />,
                    li: (props) => <li className="md-li" {...props} />,
                    strong: (props) => <strong className="md-strong" {...props} />,
                    em: (props) => <em className="md-em" {...props} />,
                    code: (props) => <code className="md-code" {...props} />,
                    hr: (props) => <hr className="md-hr" {...props} />
                  }}
                >
                  {markdownContent}
                </ReactMarkdown>
              </div>
            </div>
          ) : analysis ? (
            <div className="analysis-results">
              <div className="analysis-header">
                <span className="analysis-source">
                  {webhookUrl ? '🤖 n8n AI 분석 결과' : '🔧 로컬 분석 결과'}
                </span>
              </div>
              
              <div className="analysis-item">
                <h3>팀 구성 타입</h3>
                <p>{analysis.teamComp}</p>
              </div>
              
              <div className="analysis-item">
                <h3>강점</h3>
                <ul>
                  {analysis.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
              
              <div className="analysis-item">
                <h3>약점</h3>
                <ul>
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index}>{weakness}</li>
                  ))}
                </ul>
              </div>
              
              <div className="analysis-item">
                <h3>추천 전략</h3>
                <p>{analysis.strategy}</p>
              </div>
              
              <div className="analysis-item">
                <h3>승리 조건</h3>
                <p>{analysis.winCondition}</p>
              </div>
            </div>
          ) : (
            <div className="analysis-placeholder">
              <p style={{textAlign: 'center', color: 'var(--riot-light)', opacity: 0.7}}>
                챔피언을 입력하고 분석 버튼을 눌러주세요! 🎮
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
