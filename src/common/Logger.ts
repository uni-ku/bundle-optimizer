/* eslint-disable no-console */
import chalk from 'chalk'

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export class Logger {
  private level: LogLevel
  private context: string

  constructor(level: LogLevel = LogLevel.INFO, context: string = 'Plugin') {
    this.level = level
    this.context = context
  }

  private log(level: LogLevel, message: string) {
    if (this.shouldLog(level)) {
      const timestamp = new Date().toISOString()
      const coloredMessage = this.getColoredMessage(level, message)
      console.log(`[${timestamp}] ${coloredMessage}`)
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    return levels.indexOf(level) >= levels.indexOf(this.level)
  }

  private getColoredMessage(level: LogLevel, message: string): string {
    switch (level) {
      case LogLevel.DEBUG:
        return chalk.blue(`[${level}] [${this.context}] ${message}`)
      case LogLevel.INFO:
        return chalk.green(`[${level}] [${this.context}] ${message}`)
      case LogLevel.WARN:
        return chalk.yellow(`[${level}] [${this.context}] ${message}`)
      case LogLevel.ERROR:
        return chalk.red(`[${level}] [${this.context}] ${message}`)
      default:
        return message
    }
  }

  debug(message: string) {
    this.log(LogLevel.DEBUG, message)
  }

  info(message: string) {
    this.log(LogLevel.INFO, message)
  }

  warn(message: string) {
    this.log(LogLevel.WARN, message)
  }

  error(message: string) {
    this.log(LogLevel.ERROR, message)
  }
}

export const logger = new Logger(LogLevel.INFO, 'uni-ku:bundle-optimizer')
