import { Col, Row, Text } from "@dataesr/dsfr-plus";
import { useEffect, useState } from "react";

import "./style.scss";


export default function DataTable({ aggregations, caption, columns, dataTable, filters, numberOfResults, pagination, setFilters, setPagination, setSorting, sorting }) {
  const inputsTmp = {}
  filters.forEach((filter) => {
    inputsTmp[filter.id] = filter.value
  });
  const [inputs, setInputs] = useState(inputsTmp)

  const getLabelByBucketKey = (key: string) => {
    switch (key) {
      case '1':
        return 'Oui'
      case '0':
        return 'Non'
      default:
        return key
    }
  }

  const getSortableButton = (column) => {
    if (column.isSortable) {
      const id = column?.sortableField ?? column.id
      let icon = <i className="ri-arrow-up-down-fill" />
      if ((id === sorting?.id) && (sorting?.order === 'asc')) icon = <i className="ri-sort-asc" />
      if ((id === sorting?.id) && (sorting?.order === 'desc')) icon = <i className="ri-sort-desc" />
      return (
        <button
          aria-label={`Trier par ${(column?.label ?? column?.id).toLowerCase()}`}
          className="fr-btn fundings-datatable_filter"
          onClick={() => handleSort(column)}
          type="button"
        >
          <span aria-hidden>
            {icon}
          </span>
        </button>
      )
    }
    return ''
  }

  const getSortableAriaSort = (column) => {
    if (column.isSortable) {
      const id = column?.sortableField ?? column.id
      if ((id === sorting?.id) && (sorting?.order === 'asc')) return "ascending"
      if ((id === sorting?.id) && (sorting?.order === 'desc')) return "descending"
      return "none"
    }
  }

  const handleSort = (column) => {
    if (column.isSortable) {
      const id = column?.sortableField ?? column.id;
      if (id === sorting?.id) {
        if (sorting.order === 'asc') {
          setSorting({ id, order: 'desc' })
        } else {
          setSorting()
        }
      } else {
        setSorting({ id, order: 'asc' })
      }
    }
  }

  const handleFilter = (column, event) => {
    if (event.target.value === '') {
      const { [column.id]: _, ...rest } = inputs as any;
      setInputs(rest);
    } else {
      setInputs({ ...inputs, [column.id]: event.target.value });
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(Object.keys(inputs).map((id) => ({ id, value: inputs[id] })).filter((filter) => filter.value.length > 0))
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [inputs]);

  return (
    <>
      <div className="fr-table fr-table--sm fr-table--multiline fundings-datatable">
        <div className="fr-table__wrapper">
          <div className="fr-table__container">
            <div className="fr-table__content">
              <table>
                <caption className="fr-sr-only">{caption}</caption>
                <thead>
                  <tr>
                    {columns.map((column) => {
                      return (
                        <th key={column.id} scope="col" aria-sort={getSortableAriaSort(column)}>
                          {column.isPlaceholder ? null : (
                            <>
                              <div className="fundings-datatable__header">
                                {column?.label ?? column.id}
                                {' '}
                                {column?.isFilterable}
                                {' '}
                                {getSortableButton(column)}
                              </div>
                              <div>
                                {column?.isFilterable && (
                                  column?.isFilterableBySelect && aggregations?.[column.id] ? (
                                    <select
                                      aria-label={`Filtrer par ${(column?.label ?? column?.id).toLowerCase()}`}
                                      className="fr-select fundings-datatable__select"
                                      id={`fundings-structure-data-${column.id}`}
                                      name={`fundings-structure-data-${column.id}`}
                                      onChange={(event) => handleFilter(column, event)}
                                      value={inputs[column.id]}
                                    >
                                      <option key="all" value="">
                                        Tout
                                      </option>
                                      {(aggregations?.[column.id]?.buckets ?? []).map((bucket) => (
                                        <option key={bucket.key} value={bucket.key}>
                                          {getLabelByBucketKey(bucket.key.toString())} ({bucket.doc_count})
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      aria-label={`Filtrer par ${(column?.label ?? column?.id).toLowerCase()}`}
                                      className="fr-input fundings-datatable__input"
                                      id={`fundings-structure-data-${column.id}`}
                                      onChange={(event) => handleFilter(column, event)}
                                      type="text"
                                      value={inputs[column.id]}
                                    />
                                  )
                                )}
                              </div>
                            </>
                          )}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {dataTable.map((row) => (
                    <tr key={row.uniqId}>
                      {columns.map((column) => (
                        <td key={`${column.id}-${row.id}`}>
                          {column.getCellValue ? column.getCellValue(row) : row?.[column?.id]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <Row className="fr-mt-1w">
        <Col xs="12">
          <div className="fundings-datatable__page-size">
            <select
              className="fr-select"
              aria-label="Nombre de résultats par page"
              onChange={(e) => setPagination({ from: 0, size: Number(e.target.value) })}
              value={pagination.size}
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
            résultats par page
          </div>
        </Col>
        <Col xs="12">
          <nav role="navigation" className="fr-pagination" aria-label="Pagination">
            <ul className="fr-pagination__list">
              <li>
                <button
                  className="fr-pagination__link fr-pagination__link--first"
                  disabled={pagination.from === 0}
                  onClick={() => setPagination({ ...pagination, from: 0 })}
                  title="Première page"
                  type="button"
                >
                  Première page
                </button>
              </li>
              <li>
                <button
                  className="fr-pagination__link fr-pagination__link--prev fr-pagination__link--lg-label"
                  disabled={pagination.from === 0}
                  onClick={() => setPagination({ ...pagination, from: pagination.from - pagination.size })}
                  title="Page précédente"
                  type="button"
                >
                  Page précédente
                </button>
              </li>
              <li>
                <span className="fr-pagination__link" aria-current="page">
                  <button type="button">
                    {(pagination.from / pagination.size) + 1}
                  </button>
                </span>
              </li>
              <li>
                <button
                  className="fr-pagination__link fr-pagination__link--next fr-pagination__link--lg-label"
                  disabled={(pagination.from / pagination.size) + 1 === Math.ceil(numberOfResults / pagination.size)}
                  onClick={() => setPagination({ ...pagination, from: pagination.from + pagination.size })}
                  title="Page suivante"
                  type="button"
                >
                  Page suivante
                </button>
              </li>
              <li>
                <button
                  className="fr-pagination__link fr-pagination__link--last"
                  disabled={(pagination.from / pagination.size) + 1 === Math.ceil(numberOfResults / pagination.size)}
                  onClick={() => setPagination({ ...pagination, from: Math.floor(numberOfResults / pagination.size) * pagination.size })}
                  title="Dernière page"
                  type="button"
                >
                  Dernière page
                </button>
              </li>
            </ul>
          </nav>
        </Col>
        <Col xs="12" style={{ textAlign: 'right' }}>
          <Text className="fr-text--sm fr-mb-0" role="status">
            Résultats {pagination.from + 1} - {Math.min(pagination.from + pagination.size, numberOfResults)} / {numberOfResults}
          </Text>
        </Col>
      </Row>
    </>
  )
}