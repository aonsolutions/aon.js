
# DATA RESPONSE

  - [List Data Response](#list-data-response)
  - [Get a single Data Response](#get-a-single-data-response)
  - [Create a Data Response](#create-a-data-response)
  - [Edit a Data Response](#edit-a-data-response)
  - [Delete a Data Response](#delete-a-data-response)

## List Data Response

List all Data Response.

    GET /domains/:domain/dataResponse

You can use the filter query parameter to fetch Data Response. See the table below for more information.

### Parameters

| Name |  Type  | Description |
|------|--------|-------------|
| code | string | Data Response code, look for Data Response that contains part of the inserted code.  |
| date | string | Data Response date, look for Data Response from inserted date. |
| source | string | Source code |
| sourceId | string | Source id |
| variable | string | Data Response Detail variable |
| value | string | Data Response Detail value |

### Response

    [{
      "id": 892,
      "domain": 3049,
      "source": 0,
      "source_id": 517942,
      "code": "ES36.0013381227",
      "date": "2017-09-26T22:00:00.000Z",
      "detail": [
        {
          "id": 1902,
          "variable": "source",
          "value": "income_detail@517942"
          },
          {...}
      ]
    },
    ...
    ]


## Get a single Data Response

    GET /domains/:domain/dataResponse/:id

### Response

    [{
      "id": 892,
      "domain": 3049,
      "source": 0,
      "source_id": 517942,
      "code": "ES36.0013381227",
      "date": "2017-09-26T22:00:00.000Z",
      "detail": [
        {
          "id": 1902,
          "variable": "source",
          "value": "income_detail@517942"
          },
          {...}
      ]
    }]

## Create a Data Response

    POST /domains/:domain/dataResponse

### Parameters

| Name |  Type  | Description |
|------|--------|-------------|
| code | string | Data Response code.  |
| date | string | Data Response date. |
| source | string | Source code |
| sourceId | string | Source id |
| detail | array of Data Response Details | variable & value |

### Example

    {
      "source": 0,
      "source_id": 517942,
      "code": "ES36.0013381227",
      "date": "2017-09-26T22:00:00.000Z",
      "detail": [
        {
          "variable": "source",
          "value": "income_detail@517942"
        },
        {...}
      ]
    }

### Response

    [{
      "id": 892,
      "domain": 3049,
      "source": 0,
      "source_id": 517942,
      "code": "ES36.0013381227",
      "date": "2017-09-26T22:00:00.000Z",
      "detail": [
        {
          "id": 1902,
          "variable": "source",
          "value": "income_detail@517942"
          },
          {...}
      ]
    }]

## Edit a Data Response

    POST /domains/:domain/dataResponse/:id

## Delete a Data Response

    DELETE /domains/:domain/dataResponse/:id
