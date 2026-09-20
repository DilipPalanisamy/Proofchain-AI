from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./proofchain.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Create tables and safely add columns required by the
    current ProofChain Evidence model.
    """

    # Import models before create_all
    from app.models.claim import Claim
    from app.models.evidence import Evidence
    from app.models.analysis import Analysis

    Base.metadata.create_all(bind=engine)

    # --------------------------------------------------------
    # SAFE SQLITE MIGRATION
    # --------------------------------------------------------

    with engine.connect() as connection:

        result = connection.execute(
            text("PRAGMA table_info(evidence)")
        )

        existing_columns = {
            row[1]
            for row in result.fetchall()
        }

        # Add evidence_id if missing
        if "evidence_id" not in existing_columns:

            connection.execute(
                text(
                    "ALTER TABLE evidence "
                    "ADD COLUMN evidence_id VARCHAR(100)"
                )
            )

        # Add file_path if missing
        if "file_path" not in existing_columns:

            connection.execute(
                text(
                    "ALTER TABLE evidence "
                    "ADD COLUMN file_path VARCHAR(500)"
                )
            )

        connection.commit()