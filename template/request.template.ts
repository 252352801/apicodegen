module.exports =  `import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { from, lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import HttpResult from '~/types/HttpResult';
import { getBaseUrl } from '@/utils/getBaseUrl';
import getErrorMessage from '@/utils/getErrorMessage';
import genRequestService from '@/utils/request';

export default (config: AxiosRequestConfig) => {
  return lastValueFrom(
    from(
      genRequestService({
        baseURL: getBaseUrl('{{{baseUrl}}}'),
        validateResponse: (res) => res.status === 200 && res.data.success,
        getErrorMessage: (res) => getErrorMessage(res),
      })(config)
    ).pipe(map<AxiosResponse<HttpResult<any>>, any>((v) => v.data?.result))
  );
};
`;
