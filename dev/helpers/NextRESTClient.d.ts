import type { JoinQuery, PopulateType, SanitizedConfig, SelectType, Where } from 'payload';
type ValidPath = `/${string}`;
type RequestOptions = {
    auth?: boolean;
    query?: {
        depth?: number;
        fallbackLocale?: string;
        joins?: JoinQuery;
        limit?: number;
        locale?: string;
        page?: number;
        populate?: PopulateType;
        select?: SelectType;
        sort?: string;
        where?: Where;
    };
};
type FileArg = {
    file?: Omit<File, 'webkitRelativePath'>;
};
export declare class NextRESTClient {
    private _DELETE;
    private _GET;
    private _GRAPHQL_POST;
    private _PATCH;
    private _POST;
    private _PUT;
    private readonly config;
    private token?;
    serverURL: string;
    constructor(config: SanitizedConfig);
    private buildHeaders;
    private generateRequestParts;
    DELETE(path: ValidPath, options?: RequestInit & RequestOptions): Promise<Response>;
    GET(path: ValidPath, options?: Omit<RequestInit, 'body'> & RequestOptions): Promise<Response>;
    GRAPHQL_POST(options: RequestInit & RequestOptions): Promise<Response>;
    login({ slug, credentials, }: {
        credentials?: {
            email: string;
            password: string;
        };
        slug: string;
    }): Promise<{
        [key: string]: unknown;
    }>;
    PATCH(path: ValidPath, options: FileArg & RequestInit & RequestOptions): Promise<Response>;
    POST(path: ValidPath, options?: FileArg & RequestInit & RequestOptions): Promise<Response>;
    PUT(path: ValidPath, options: FileArg & RequestInit & RequestOptions): Promise<Response>;
}
export {};
