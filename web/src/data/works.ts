// 梵高专题作品数据。日期对应此处展示的具体馆藏版本。
export interface WorkListItem {
  name: string
  meta?: string
  tags?: string[]
  link?: string
  slug?: string
}

export interface WorkGroup {
  heading: string
  items: string[]
}

export interface WorkSection {
  id: string
  no: string
  title: string
  tagline: string
  items?: WorkListItem[]
  groups?: WorkGroup[]
  awards?: string[]
  footer?: string
}

export interface WorksLang {
  title: string
  closeLabel: string
  openLabel: string
  hint: string
  awardsLabel: string
  visitLabel: string
  detailPlaceholder: string
  phImageLabel: string
  phButtonLabel: string
  countLabel: (n: number) => string
  sections: WorkSection[]
}

const CONTENT = {
  "title": "Selected Works · 代表作品",
  "closeLabel": "返回",
  "openLabel": "了解画作",
  "hint": "继续探索",
  "awardsLabel": "馆藏",
  "visitLabel": "查看博物馆馆藏",
  "detailPlaceholder": "",
  "phImageLabel": "",
  "phButtonLabel": "",
  "sections": [
    {
      "id": "earth",
      "no": "01",
      "title": "土地与生活",
      "tagline": "THE EARLY YEARS · 荷兰时期",
      "items": [
        {
          "name": "吃土豆的人",
          "meta": "1885 · 纽南",
          "slug": "van-gogh-potato-eaters"
        }
      ],
      "footer": "凝视普通人的日常"
    },
    {
      "id": "sunlight",
      "no": "02",
      "title": "南法的光",
      "tagline": "ARLES · 阿尔勒时期",
      "items": [
        {
          "name": "向日葵",
          "meta": "1889 · 阿尔勒",
          "slug": "van-gogh-sunflowers"
        },
        {
          "name": "卧室",
          "meta": "1888 · 阿尔勒",
          "slug": "van-gogh-bedroom"
        }
      ],
      "footer": "在色彩中寻找生活的温度"
    },
    {
      "id": "sky",
      "no": "03",
      "title": "星空与新生",
      "tagline": "SAINT-RÉMY · 圣雷米时期",
      "items": [
        {
          "name": "星月夜",
          "meta": "1889 · 圣雷米",
          "slug": "van-gogh-starry-night"
        },
        {
          "name": "盛开的杏花",
          "meta": "1890 · 圣雷米",
          "slug": "van-gogh-almond-blossom"
        }
      ],
      "footer": "从自然出发，让想象延伸"
    }
  ]
}

export const WORKS: Record<'zh' | 'en', WorksLang> = {
  zh: { ...CONTENT, countLabel: n => `${n} 件作品` },
  en: { ...CONTENT, closeLabel: 'Back', visitLabel: 'View museum collection', countLabel: n => `${n} works` },
}

export const SECTION_COVERS: Record<string, string> = {
  earth: `${import.meta.env.BASE_URL}works/van-gogh/potato-eaters.jpg`,
  sunlight: `${import.meta.env.BASE_URL}works/van-gogh/sunflowers.jpg`,
  sky: `${import.meta.env.BASE_URL}works/van-gogh/starry-night.jpg`,
}

export function sectionCount(section: WorkSection): number {
  return section.items?.length ?? section.groups?.reduce((n, group) => n + group.items.length, 0) ?? 0
}
