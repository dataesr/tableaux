import { useSearchParams } from "react-router-dom"

import { getI18nLabel } from "../../../../../../utils"
import i18n from "../../../../i18n-global.json"
import { isEjoParam } from "../../../../utils/params"
import { getCountryNameWithArticle } from "../../../../utils/country-mapping"
import { getCountryAdjectives } from "../../../../../../components/country-selector/utils.jsx"
import { formatToPercentLang } from "../../../../../../utils/format"


export function useGetParams() {
  const [searchParams] = useSearchParams()

  const params: string[] = []

  // Récupérer le paramètre country_code s'il existe
  const countryCode = searchParams.get("country_code")
  if (countryCode) {
    params.push(`country_code=${countryCode}`)
  }

  // Récupérer le paramètre pillarId et l'ajouter comme pillars s'il existe
  const pillarId = searchParams.get("pillarId")
  if (pillarId) {
    params.push(`pillars=${pillarId}`)
  }

  if (searchParams.has("isEjo")) {
    params.push(isEjoParam())
  }

  const currentLang = (searchParams.get("language") === "en" ? "en" : "fr") as "fr" | "en"

  const code = countryCode || "FRA"
  const countryN = getCountryNameWithArticle(code, currentLang).replace(/^(Le |La |Les |L')/, (m) => m.toLowerCase())

  const countryAdj = getCountryAdjectives(code, currentLang)
  // Pluriel seulement en français
  const adjMascPlural =
  currentLang === "fr" && !countryAdj.m.endsWith("s") ? `${countryAdj.m}s` : countryAdj.m


  return { params: params.join("&"), currentLang, countryN, adjMascPlural }
}


export function renderDataTable(data, currentLang) {
  if (!data) return null
  
  const rawData = data.data
  const evaluatedData = rawData.filter((item) => item.stage === "evaluated")
  const successfulData = rawData.filter((item) => item.stage === "successful")


  const labels = {
    caption: getI18nLabel(i18n, "funding-proportion-by-country"),
    program: getI18nLabel(i18n, "program"),
    evaluated: getI18nLabel(i18n, "evaluated"),
    successful: getI18nLabel(i18n, "successful"),
  }
  
  return (
    <div className="fr-table fr-table--bordered fr-table--sm">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">{labels.caption}</caption>
              <thead>
                <tr>
                  <th scope="col">{labels.program}</th>
                  <th scope="col">{labels.evaluated}</th>
                  <th scope="col">{labels.successful}</th>
                </tr>
              </thead>
              <tbody>
                {evaluatedData.map((evalItem) => {
                  const programName = currentLang === "fr" ? evalItem.programme_name_fr : evalItem.programme_name_en
                  const successItem = successfulData.find((item) => item.program === evalItem.program)

                  const evaluatedProportion = evalItem.proportion || 0
                  const successfulProportion = successItem?.proportion || 0

                  return (
                    <tr key={evalItem.program}>
                      <th scope="row">{programName}</th>
                      <td>{formatToPercentLang(evaluatedProportion, currentLang)}</td>
                      <td>{formatToPercentLang(successfulProportion, currentLang)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// Clé de proportion renvoyée par l'API selon l'indicateur affiché
export const getProportionKey = (displayType: string) =>
  displayType === "total_coordination_number"
    ? "proportion_coordination_number"
    : displayType === "total_number_involved"
      ? "proportion_number_involved"
      : displayType === "total_fund_eur"
        ? "proportion"
        : "proportion_projects"


export function readingKey(data, isLoading, displayType, currentLang, countryN, adjMascPlural) {
  if (isLoading || !data?.data || data.data.length === 0) {
    return { fr: <></>, en: <></> }
  }

  const proportionKey = getProportionKey(displayType)

  const successfulProjects = data.data.filter((item) => item.stage === "successful")
  const topSuccessfulProgram = successfulProjects.reduce(
    (max, current) => (current[proportionKey] > max[proportionKey] ? current : max),
    successfulProjects[0],
  )

  if (!topSuccessfulProgram) return { fr: <></>, en: <></> }

  const evaluatedData = data.data.find((item) => item.program === topSuccessfulProgram.program && item.stage === "evaluated")
  if (!evaluatedData) return { fr: <></>, en: <></> }

  const programNameFr = topSuccessfulProgram.programme_name_fr
  const programNameEn = topSuccessfulProgram.programme_name_en
  const successfulProportion = topSuccessfulProgram[proportionKey]
  const evaluatedProportion = evaluatedData[proportionKey]
  const difference = successfulProportion - evaluatedProportion

  const diff = `${difference > 0 ? "+" : ""}${difference.toFixed(2)}`

  let fr
  let en

  switch (displayType) {
    case "total_coordination_number":
      fr = (
        <>
          Dans le programme {programNameFr}, les projets évalués coordonnés par {countryN} représentent {formatToPercentLang(evaluatedProportion, currentLang)}{" "}
          de l'ensemble des projets évalués et les projets lauréats coordonnés par {countryN} représentent{" "}
          {formatToPercentLang(successfulProportion, currentLang)} des projets lauréats, soit un écart de{" "}
          {diff} points.
        </>
      )
      en = (
        <>
          In the {programNameEn} programme, evaluated projects coordinated by {countryN} account for {formatToPercentLang(evaluatedProportion, currentLang)}{" "}
          of all evaluated projects, and successful projects coordinated by {countryN} account for{" "}
          {formatToPercentLang(successfulProportion, currentLang)} of successful projects, a difference of{" "}
          {diff} percentage points.
        </>
      )
      break

    case "total_number_involved":
      fr = (
        <>
          Dans le programme {programNameFr}, les candidats {adjMascPlural} représentent {formatToPercentLang(evaluatedProportion, currentLang)}{" "}
          de l'ensemble des candidats et les participants {adjMascPlural} représentent {formatToPercentLang(successfulProportion, currentLang)} de{" "}
          l'ensemble des participants, soit un écart de {diff} points.
        </>
      )
      en = (
        <>
          In the {programNameEn} programme, {adjMascPlural} applicants account for {formatToPercentLang(evaluatedProportion, currentLang)}{" "}
          of all applicants, and {adjMascPlural} participants account for {formatToPercentLang(successfulProportion, currentLang)} of{" "}
          all participants, a difference of {diff} percentage points.
        </>
      )
      break

    case "total_projects":
      fr = (
        <>
          Dans le programme {programNameFr}, {formatToPercentLang(evaluatedProportion, currentLang)} des projets évalués et{" "} 
          {formatToPercentLang(successfulProportion, currentLang)} des projets lauréats impliquent {countryN}, soit un écart de {diff} points.
        </>
      )
      en = (
        <>
          In the {programNameEn} programme, {formatToPercentLang(evaluatedProportion, currentLang)} of evaluated projects and{" "}
          {formatToPercentLang(successfulProportion, currentLang)} of successful projects involve {countryN}, a difference of {diff} percentage points.
        </>
      )
      break

    default:
      fr = (
        <>
          Dans le programme {programNameFr}, les financements demandés par {countryN} représentent {formatToPercentLang(evaluatedProportion, currentLang)}{" "}
          de l'ensemble des financements demandés et les financements obtenus par {countryN} représentent {formatToPercentLang(successfulProportion, currentLang)}{" "}
          des financements obtenus, soit un écart de {diff} points.
        </>
      )
      en = (
        <>
          In the {programNameEn} programme, funding requested by {countryN} accounts for {formatToPercentLang(evaluatedProportion, currentLang)}{" "}
          of all funding requested, and funding secured by {countryN} accounts for {formatToPercentLang(successfulProportion, currentLang)}{" "}
          of funding secured, a difference of {diff} percentage points.
        </>
      )
  }

    return { fr, en }
}
