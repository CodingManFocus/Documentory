# Documentory
###### Pronounced: "dok-yoo-men-tuh-ree"

A document MCP server for AI IDE( Cursor, Windsurf etc. )

### WARNING ::: It is beta. so it can make a problem

## How to run

- **1. Clone this repository**
- **2. run `npm install`**
- **3. run `node server.js`**
- then, the server is gonna open


## MCP Tools :::

### listDocuments
- 설명 (Description): 현재 서버에 저장된 모든 문서의 목록을 가져옵니다. 각 문서의 이름과 생성/수정 시간을 포함한 메타데이터를 반환합니다. 문서 아카이브의 전체 내용을 확인하거나 특정 문서를 찾기 전에 사용하면 유용합니다.
- 사용 시점: 전체 문서 목록을 확인하거나, 특정 문서를 찾기 위한 탐색을 시작할 때 사용합니다.
  
### readDocument
- 설명 (Description): 지정된 이름의 문서를 읽고 그 내용을 반환합니다. 문서의 텍스트 콘텐츠를 정확하게 가져올 때 사용됩니다.
- 사용 시점: 특정 문서의 내용을 읽거나, 문서 내용을 기반으로 작업을 수행해야 할 때 사용합니다.

### writeDocument
- 설명 (Description): 새 문서를 생성하거나 기존 문서를 덮어씁니다. overwrite 옵션을 통해 기존 문서 덮어쓰기 여부를 제어할 수 있습니다. overwrite가 false이고 문서가 이미 존재하면 에러를 반환합니다. 문서의 제목과 내용을 사용하여 문서를 생성하거나 업데이트할 때 사용합니다.
- 사용 시점: 새로운 문서를 작성하거나, 기존 문서의 내용을 완전히 새로운 내용으로 대체할 때 사용합니다.

### updateDocument
- 설명 (Description): 기존 문서의 내용을 업데이트합니다. 이 도구는 writeDocument와 달리 문서의 특정 부분을 변경하거나 내용을 추가하는 방식으로 업데이트할 때 적합합니다. 지정된 문서가 없으면 에러를 반환합니다.
- 사용 시점: 기존 문서의 내용을 수정하거나, 새로운 내용을 기존 문서에 추가할 때 사용합니다.

### deleteDocument
- 설명 (Description): 지정된 이름의 문서를 영구적으로 삭제합니다. 삭제된 문서는 복구할 수 없으므로 주의해서 사용해야 합니다.
- 사용 시점: 더 이상 필요 없는 문서를 제거하거나, 문서 아카이브를 정리할 때 사용합니다.

### searchDocuments
- 설명 (Description): 주어진 키워드를 포함하는 문서를 검색합니다. 문서 내용에서 특정 정보를 찾거나, 관련된 문서를 필터링할 때 유용합니다. 검색 결과는 문서 이름과 키워드가 포함된 내용을 반환합니다.
- 사용 시점: 특정 키워드를 포함하는 문서를 찾거나, 문서 아카이브에서 관련성 있는 정보를 검색할 때 사용합니다.


