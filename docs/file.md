# FILE

  - [File Module](#file-module)
  - [List Files](#list-files)
  - [Get a single File](#get-a-single-file)
  - [Create a File](#create-a-file)
  - [Edit a File](#edit-a-file)
  - [Delete a File](#delete-a-file)
  - [Download File](#download-file)

## File Module

There are 9 modules of documents. See the table below for more information.

| Name | Description |
|------|-------------|
| contract | -  |
| data | - |
| invoice | - |
| item | - |
| offer | - |
| payroll | - |
| project | - |
| registry | - |
| sepe | - |

## List Files

List all files.

    GET /domains/:domain/file

You can use the filter query parameter to fetch File. See the table below for more information.

### Parameters

| Name |  Type  | Description |
|------|--------|-------------|
| module | [required] string | File module.  |
| date | string | File date, look for file from inserted date. |


### Response

    [{
      "id": 892,
      "domain": 3049,
      "module": {
        "id": 12,
        "name": "registry"
      },
      "mimetype": "application/pdf",
      "name": "filename",
      "type": {
        "id": 1,
        "name": "corporate_identity"
      },
      "drive": "8akeIAS892Nas"
      "scope":{
        "id":1,
        "name": "principal"
      },
      "confidential": true,
      "category": {
        "id":2,
        "name": "as"
      },
      "size": "18kb",
      "md5": ""
    },
    ...
    ]

## Get a single file

    GET /domains/:domain/file/:id

### Parameters

| Name |  Type  | Description |
|------|--------|-------------|
| module | [required] string | File module.  |

### Response

    [{
      "id": 892,
      "domain": 3049,
      "module": {
        "id": 12,
        "name": "registry"
      },
      "mimetype": "application/pdf",
      "name": "filename",
      "type": {
        "id": 1,
        "name": "corporate_identity"
      },
      "drive": "8akeIAS892Nas"
      "scope":{
        "id":1,
        "name": "principal"
      },
      "confidential": true,
      "category": {
        "id":2,
        "name": "as"
      },
      "size": "18kb",
      "md5": ""
    }]

## Create a File

    POST /domains/:domain/file

### Parameters

| Name |  Type  | Description |
|------|--------|-------------|
| module | [required] string | File module.  |

## Edit a File

    POST /domains/:domain/file/:id

### Parameters

| Name |  Type  | Description |
|------|--------|-------------|
| module | [required] string | File module.  |

## Delete a File

    DELETE /domains/:domain/file/:id

### Parameters

| Name |  Type  | Description |
|------|--------|-------------|
| module | [required] string | File module.  |

## Download File

    GET /domains/:domain/file/download/:id

### Parameters

| Name |  Type  | Description |
|------|--------|-------------|
| module | [required] string | File module.  |
