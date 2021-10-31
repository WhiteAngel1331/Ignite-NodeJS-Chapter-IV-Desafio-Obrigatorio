import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetBalanceUseCase } from "./GetBalanceUseCase";

let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let usersRepository: IUsersRepository;
let statementRepository: IStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;
let getBalanceUseCase: GetBalanceUseCase;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Create Statement", () => {
  beforeEach(async () => {
    usersRepository = new InMemoryUsersRepository();
    statementRepository = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(usersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepository);
    createStatementUseCase = new CreateStatementUseCase(
      usersRepository,
      statementRepository
    );
    getBalanceUseCase = new GetBalanceUseCase(
      statementRepository,
      usersRepository
    );

    await createUserUseCase.execute({
      email: "white@angel.com.br",
      name: "white",
      password: "123456",
    });
  });

  it("cannot Get balance if user is not authenticated", async () => {
    expect(async () => {
      const session = await authenticateUserUseCase.execute({
        email: "white@angel.com.br",
        password: "1234569",
      });

      await getBalanceUseCase.execute({
        user_id: session.user.id as string,
      });
    }).rejects.toBeInstanceOf(AppError);
  });

  it("Should be able to get balance", async () => {
    const session = await authenticateUserUseCase.execute({
      email: "white@angel.com.br",
      password: "123456",
    });

    await createStatementUseCase.execute({
      amount: 100,
      description: "test",
      type: "deposit" as OperationType,
      user_id: session.user.id as string,
    });

    await createStatementUseCase.execute({
      amount: 10,
      description: "test",
      type: "withdraw" as OperationType,
      user_id: session.user.id as string,
    });

    await createStatementUseCase.execute({
      amount: 30,
      description: "test",
      type: "withdraw" as OperationType,
      user_id: session.user.id as string,
    });

    const balance = await getBalanceUseCase.execute({
      user_id: session.user.id as string,
    });

    expect(balance.balance).toBe(60);
  });
});
