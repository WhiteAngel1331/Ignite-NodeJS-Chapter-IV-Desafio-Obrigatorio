import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementUseCase } from "./CreateStatementUseCase";

let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let usersRepository: IUsersRepository;
let statementRepository: IStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
  TRANSFER = "transfer",
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

    await createUserUseCase.execute({
      email: "white@angel.com.br",
      name: "white",
      password: "123456",
    });
  });

  it("cannot operate if user is not authenticated", async () => {
    expect(async () => {
      const session = await authenticateUserUseCase.execute({
        email: "white@angel.com.br",
        password: "1234569",
      });

      await createStatementUseCase.execute({
        amount: 100,
        description: "test",
        type: "deposit" as OperationType,
        user_id: session.user.id as string,
      });
    }).rejects.toBeInstanceOf(AppError);
  });

  it("can operate a deposit statement", async () => {
    const session = await authenticateUserUseCase.execute({
      email: "white@angel.com.br",
      password: "123456",
    });

    const statement = await createStatementUseCase.execute({
      amount: 100,
      description: "test",
      type: "deposit" as OperationType,
      user_id: session.user.id as string,
    });

    expect(statement).toHaveProperty("id");
  });

  it("can operate a WITHDRAW statement with funds", async () => {
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

    const statement = await createStatementUseCase.execute({
      amount: 100,
      description: "test",
      type: "withdraw" as OperationType,
      user_id: session.user.id as string,
    });

    expect(statement).toHaveProperty("id");
  });

  it("cannot operate a WITHDRAW statement without funds", async () => {
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

    expect(async () => {
      await createStatementUseCase.execute({
        amount: 120,
        description: "test",
        type: "withdraw" as OperationType,
        user_id: session.user.id as string,
      });
    }).rejects.toBeInstanceOf(AppError);
  });
});
