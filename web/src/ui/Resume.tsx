import { motion } from 'framer-motion'
import { SOCIAL_ICONS } from './SocialIcons'
import { FOCUS_POINTS } from '../data/focusPoints'


// 履历数据（双语）。英文为译稿，可按需润色。
interface ResumeGroup {
  heading?: string
  logo?: string
  logoImg?: string
  sub?: string
  link?: string
  items?: string[]
  links?: { id: string; label: string; href: string }[]
}
interface ResumeEntry {
  period: string
  place: string
  role?: string
  logo?: { src: string; alt: string }
  points?: string[]
  groups?: ResumeGroup[]
}
const RESUME: Record<'en' | 'zh', { title: string; entries: ResumeEntry[] }> = {
  "zh": {
    "title": "艺术人生",
    "entries": [
      {
        "period": "1853—1885 · 早年与荷兰",
        "place": "从津德尔特出发",
        "role": "寻找方向，走向绘画",
        "points": [
          "1853 年 3 月 30 日出生于荷兰津德尔特；1880 年决定成为画家。",
          "关注农民与乡间生活，在纽南完成《吃土豆的人》（1885）。"
        ]
      },
      {
        "period": "1886—1888 · 巴黎",
        "place": "让色彩变得明亮",
        "role": "印象派影响 · 色彩与笔触实验",
        "points": [
          "与弟弟提奥同住，接触印象派与新印象派绘画。",
          "调色逐渐明亮，以自画像等题材探索互补色与短笔触。"
        ]
      },
      {
        "period": "1888—1889 · 阿尔勒",
        "place": "南法阳光与黄色小屋",
        "role": "向日葵 · 卧室 · 艺术家共同体的理想",
        "points": [
          "1888 年 2 月来到阿尔勒，描绘果园、人物和日常生活。",
          "在黄色小屋构想艺术家共同生活的工作室，高更曾于此短暂同住。"
        ]
      },
      {
        "period": "1889—1890 · 圣雷米",
        "place": "星空之下，继续作画",
        "role": "《星月夜》 · 《盛开的杏花》",
        "points": [
          "1889 年 5 月自愿入住圣雷米疗养院，在治疗期间持续创作。",
          "从窗外景色、柏树与橄榄园汲取灵感，让观察与想象交织。"
        ]
      },
      {
        "period": "1890 · 瓦兹河畔奥维尔",
        "place": "最后的创作时光",
        "role": "田野 · 村庄 · 肖像",
        "points": [
          "1890 年 5 月迁居奥维尔，在加歇医生照料下继续密集作画。",
          "7 月 29 日逝世，年仅 37 岁；作品与书信留下他对自然、色彩和艺术的探索。"
        ]
      }
    ]
  },
  "en": {
    "title": "A Life in Colour",
    "entries": [
      {
        "period": "1853–1885 · The Netherlands",
        "place": "Beginnings in Zundert",
        "role": "Finding a path to painting",
        "points": [
          "Born on 30 March 1853; decided to become an artist in 1880.",
          "Painted rural life and completed The Potato Eaters in Nuenen in 1885."
        ]
      },
      {
        "period": "1886–1888 · Paris",
        "place": "A brighter palette",
        "role": "Colour and brushwork experiments",
        "points": [
          "Lived with his brother Theo and encountered Impressionism and Neo-Impressionism.",
          "Explored complementary colours and short brushstrokes through self-portraits and other subjects."
        ]
      },
      {
        "period": "1888–1889 · Arles",
        "place": "Sunlight and the Yellow House",
        "role": "Sunflowers · The Bedroom",
        "points": [
          "Moved to Arles in February 1888 to paint the southern French landscape.",
          "Hoped to create an artists’ community; Paul Gauguin briefly joined him."
        ]
      },
      {
        "period": "1889–1890 · Saint-Rémy",
        "place": "Painting beneath the stars",
        "role": "The Starry Night · Almond Blossom",
        "points": [
          "Voluntarily entered the asylum in May 1889 and continued painting during treatment.",
          "Combined observation and imagination in views of the sky and surrounding countryside."
        ]
      },
      {
        "period": "1890 · Auvers-sur-Oise",
        "place": "The final months",
        "role": "Fields · Village scenes · Portraits",
        "points": [
          "Moved to Auvers in May 1890, under the care of Dr Paul Gachet.",
          "Died on 29 July 1890, aged 37, leaving an enduring body of paintings and letters."
        ]
      }
    ]
  }
}

// 履历条目依次对应 glb 里的聚焦锚点（相机停靠点），顺序须与 entries 一致。
// 名单是唯一真源，见 data/focusPoints.ts（Scene.tsx 也从那里取）。
const POINT_ORDER = FOCUS_POINTS

const EASE = [0.22, 1, 0.36, 1]
const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
}
const itemV = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
}

function Group({ group }: { group: ResumeGroup }) {
  const heading =
    group.link ? (
      <a className="about-link" href={group.link} target="_blank" rel="noopener noreferrer">
        {group.heading}
      </a>
    ) : (
      <span>{group.heading}</span>
    )

  return (
    <motion.div className="tl-group" variants={itemV}>
      <div className="tl-group-head">
        {group.logoImg && (
          <span className="tl-group-logo">
            <img src={group.logoImg} alt={group.heading || ''} loading="lazy" />
          </span>
        )}
        {heading}
        {group.sub && <span className="tl-group-sub">{group.sub}</span>}
      </div>
      {group.items && (
        <ul className="tl-points">
          {group.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )}
      {group.links && (
        <div className="tl-logos">
          {group.links.map((l) => {
            const Icon = SOCIAL_ICONS[l.id as keyof typeof SOCIAL_ICONS]
            return (
              <a
                key={l.id}
                className="tl-logo"
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={l.label}
                title={l.label}
              >
                <Icon />
              </a>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

function Entry({ entry, index }: { entry: ResumeEntry; index: number }) {
  return (
    <motion.div
      className="tl-entry"
      data-point={POINT_ORDER[index]}
      variants={containerV}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-12% 0px -12% 0px' }}
    >
      <motion.span className="tl-dot" variants={itemV} aria-hidden="true" />
      {/* tl-body 包住文字内容（点保持在外做时间轴标记）：移动端可给它加卡片衬底，
          且它紧贴内容高度，不含 tl-entry 用于排布的大 padding。
          用普通 div（非 motion）：framer 变体经 React context 穿透它，叶子元素仍是
          tl-entry 的直接 stagger 子级，入场动画与包裹前完全一致。 */}
      <div className="tl-body">
        <motion.div className="tl-period" variants={itemV}>
          {entry.period}
        </motion.div>
        <motion.div className="tl-head" variants={itemV}>
          {entry.logo && (
            <span className="tl-logo-chip">
              <img src={entry.logo.src} alt={entry.logo.alt} loading="lazy" />
            </span>
          )}
          <h3 className="tl-place">{entry.place}</h3>
        </motion.div>
        {entry.role && (
          <motion.div className="tl-role" variants={itemV}>
            {entry.role}
          </motion.div>
        )}
        {entry.points && (
          <motion.ul className="tl-points" variants={itemV}>
            {entry.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </motion.ul>
        )}
        {entry.groups && entry.groups.map((g, i) => <Group key={i} group={g} />)}
      </div>
    </motion.div>
  )
}

export default function Resume({ lang }: { lang: 'en' | 'zh' }) {
  const data = RESUME[lang]
  return (
    <section className="resume" lang={lang}>
      <motion.h2
        className="resume-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {data.title}
      </motion.h2>
      <div className="timeline">
        {data.entries.map((e, i) => (
          <Entry key={i} entry={e} index={i} />
        ))}
      </div>
    </section>
  )
}
