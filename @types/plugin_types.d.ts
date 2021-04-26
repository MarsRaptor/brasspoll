
type shallow_t = { [key: string]: number | boolean | string | undefined }
type deep_t = { [key: string]: deep_t | number | boolean | string | any[] | undefined }

type base_option<T extends shallow_t> = {
    label: string,
    plugin?: string
} & T;

type full_option<T extends shallow_t, U extends deep_t> = {
    base_option: base_option<T>
} & U;

type BrasspollPlugin<T extends shallow_t, U extends deep_t> = {
    id: string;
    label: string;
    details_template(locals?: deep_t): string;
    search(search: string): Promise<Array<{ base_option: base_option<T> }>>;
    sanitize(retreival_data: Array<base_option<T>>): Array<base_option<T>>;
    fetchDetails(retreival_data: Array<base_option<T>>,optimize:boolean): Promise<Array<full_option<T, U>>>;
    optionQuery(poll_id: number, retrieval_data: base_option<T>): { text: string, values: any[] };
}