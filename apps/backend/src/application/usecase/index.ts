export type UseCaseResult<TData, TErr> = { ok: true; data: TData } | { ok: false; error: TErr };

export type UseCase<TDeps, TInput, TOutput, TErr = string> = (
	deps: TDeps,
) => (input: TInput) => UseCaseResult<TOutput, TErr>;

export const success = <TData>(data: TData): UseCaseResult<TData, never> => ({ ok: true, data });
export const failure = <TErr>(error: TErr): UseCaseResult<never, TErr> => ({
	ok: false,
	error,
});
