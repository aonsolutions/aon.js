# USER

  - [List User](#list-user)
  - [Get a single User](#get-a-single-user)
  - [Create / Edit a User](#create-/-edit-a-user)
  - [Delete a User](#delete-a-user)

## List User

List all User.

    GET /user/

You can use the filter query parameter to fetch User. See the table below for more information.

### Parameters

  | Name |  Type  | Description |
  |------|--------|-------------|
  | email | string | Email |
  | company | string | Company |
  | group | string | Group |

## Get a single User

    GET /user/:email

## Create / Edit a Invoice

    POST /user

### Parameters

    | Name |  Type  | Description |
    |------|--------|-------------|
    | email | string | User email. |
    | alias | string | User alias. |
    | password | string | User password. |
    | companies | [string] | Array of companies (CIF) |
    | groups | [string] | Array of groups |

## Delete a Invoice

    DELETE /user/:email
