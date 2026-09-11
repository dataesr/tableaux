import { getCssColor as getCssColorGlobal } from "../../utils/colors"

const funders = ["ANR", "PIA ANR", "PIA hors ANR", "Horizon 2020", "Horizon Europe"]

const pattern = { height: 4, path: "M 2 2 l 2 2", width: 4 }

const YEAR_MIN = 2009
const YEAR_MAX = 2025
const years: number[] = Array.from(Array(YEAR_MAX - YEAR_MIN + 1).keys()).map((item) => item + YEAR_MIN)

const formatCompactNumber = (number: number): string => {
  const formatter = Intl.NumberFormat("fr", { notation: "compact" })
  return formatter.format(number)
}

const formatPercent = (number: number, decimals: number = 0): string => {
  const formatter = new Intl.NumberFormat("fr", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
    style: "percent",
  })
  return formatter.format(number)
}

const getCssColor = ({ name, prefix = "" }: { name: string, prefix?: string }): string => {
  let variableName: string = ""
  if (prefix?.length > 0) variableName += `${prefix}-`
  variableName += name.toLowerCase().replace(/[^0-9a-z ]/g, "").replace(/  +/g, " ").replaceAll(" ", "-")
  let color = getCssColorGlobal(variableName)
  if (color === '') {
    console.error(`No CSS color for ${variableName}`)
    color = "#c3c3c3"
  }
  return color
}

const getEsQuery = ({ regions, structures, yearMax = years[years.length - 1], yearMin = years[0] }:
  { regions?: (string | null)[], structures?: (string | null)[], yearMax?: number | string | null, yearMin?: number | string | null }) => {
  const query: any = {
    size: 0,
    query: {
      bool: {
        filter: [
          { range: { project_year: { gte: yearMin, lte: yearMax } } },
          { term: { participant_isFrench: true } },
          { term: { participant_status: "active" } },
          { terms: { "project_type.keyword": funders } },
        ],
      },
    },
  }
  const structuresNotNull = structures?.filter((structure) => structure !== null)
  if (structuresNotNull?.length ?? 0 > 0) {
    // query.query.bool.filter.push({ term: { participant_is_main_parent: 1 } })
    query.query.bool.filter.push({ term: { participant_type: "institution" } })
    query.query.bool.filter.push({ terms: { "participant_typologie_1.keyword": ["Ecoles, instituts et assimilés", "Organismes de recherche", "Universités et assimilés"] } })
    query.query.bool.filter.push({ terms: { "participant_id.keyword": structuresNotNull } })
  }
  const regionsNotNull = regions?.filter((region) => region !== null)
  if (regionsNotNull?.length ?? 0 > 0) {
    query.query.bool.filter.push({ terms: { "participant_typologie_1.keyword": ["Ecoles, instituts et assimilés", "Organismes de recherche", "Structures de recherche", "Universités et assimilés"] } })
    query.query.bool.filter.push({ terms: { "participant_region.keyword": regionsNotNull } })
  }
  return query
}

const getYearRangeLabel = ({ isBold = false, yearMax, yearMin }: { isBold?: boolean, yearMax: string | null, yearMin: string | null }): string => {
  let label = ""
  if (yearMin === yearMax) {
    label += "en "
    if (isBold) label += "<b>"
    label += `${yearMin}`
    if (isBold) label += "</b>"
  } else {
    label += "entre "
    if (isBold) label += "<b>"
    label += `${yearMin}`
    if (isBold) label += "</b>"
    label += " et "
    if (isBold) label += "<b>"
    label += `${yearMax}`
    if (isBold) label += "</b>"
  }
  return label
}

export {
  formatCompactNumber,
  formatPercent,
  funders,
  getCssColor,
  getEsQuery,
  getYearRangeLabel,
  pattern,
  years,
}
