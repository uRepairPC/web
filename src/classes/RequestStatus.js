'use strict'

import Api from '@/common/classes/Api'

export default class RequestStatus extends Api {

  static get __API_POINT() {
    return 'requests/statuses'
  }
}
