# AWS Elastic Beanstalk looks for application.py and the 'application' callable by default
from app import create_app

application = create_app()

if __name__ == "__main__":
    application.run()
